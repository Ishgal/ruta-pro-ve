import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (dbUser?.role !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const { id } = await params
  const { action } = await request.json() as { action: 'approve' | 'reject' }

  const payment = await prisma.payment.findUnique({
    where: { id },
    select: { id: true, status: true, certificateId: true, subscriptionId: true, extraCourseEnrollmentId: true, userId: true },
  })
  if (!payment) return NextResponse.json({ error: 'Pago no encontrado' }, { status: 404 })
  if (payment.status !== 'pending') return NextResponse.json({ error: 'Pago ya procesado' }, { status: 400 })

  if (action === 'approve') {
    if (payment.certificateId) {
      // Certificate payment — also finalize coupon if one was reserved
      const certDiscount = await prisma.certDiscount.findFirst({
        where: { paymentId: id },
        select: { id: true },
      })
      await prisma.$transaction([
        prisma.payment.update({ where: { id }, data: { status: 'paid', paidAt: new Date() } }),
        prisma.certificate.update({ where: { id: payment.certificateId }, data: { pdfUrl: 'unlocked' } }),
        ...(certDiscount ? [prisma.certDiscount.update({ where: { id: certDiscount.id }, data: { usedAt: new Date() } })] : []),
      ])
    } else if (payment.subscriptionId) {
      // Plan payment — activate subscription and upgrade user plan
      const sub = await prisma.subscription.findUnique({
        where: { id: payment.subscriptionId },
        select: { plan: true },
      })
      if (!sub) return NextResponse.json({ error: 'Suscripcion no encontrada' }, { status: 404 })

      const now = new Date()
      const expiresAt = new Date(now)
      expiresAt.setMonth(expiresAt.getMonth() + 1)

      // How many cert discount coupons to generate this month
      const couponsSetting = await prisma.appSetting.findUnique({
        where: { key: sub.plan === 'plata' ? 'plan_coupons_plata' : 'plan_coupons_oro' },
      })
      const discountSetting = await prisma.appSetting.findUnique({
        where: { key: sub.plan === 'plata' ? 'plan_discount_pct_plata' : 'plan_discount_pct_oro' },
      })
      const couponsCount = parseInt(couponsSetting?.value ?? (sub.plan === 'plata' ? '1' : '2'))
      const discountPct = parseInt(discountSetting?.value ?? (sub.plan === 'plata' ? '50' : '30'))

      // End of current month for coupon expiry
      const couponExpiry = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

      await prisma.$transaction([
        prisma.payment.update({ where: { id }, data: { status: 'paid', paidAt: now } }),
        prisma.subscription.update({
          where: { id: payment.subscriptionId },
          data: { status: 'active', startedAt: now, expiresAt },
        }),
        prisma.user.update({ where: { id: payment.userId }, data: { plan: sub.plan } }),
        // Generate monthly cert discount coupons
        ...Array.from({ length: couponsCount }, () =>
          prisma.certDiscount.create({
            data: { userId: payment.userId, discountPct, expiresAt: couponExpiry },
          })
        ),
      ])
    } else if (payment.extraCourseEnrollmentId) {
      // Extra course payment — activate enrollment and create progress record
      const enrollment = await prisma.extraCourseEnrollment.findUnique({
        where: { id: payment.extraCourseEnrollmentId },
        select: { courseId: true, userId: true },
      })
      if (!enrollment) return NextResponse.json({ error: 'Matricula no encontrada' }, { status: 404 })

      await prisma.$transaction([
        prisma.payment.update({ where: { id }, data: { status: 'paid', paidAt: new Date() } }),
        prisma.extraCourseEnrollment.update({
          where: { id: payment.extraCourseEnrollmentId },
          data: { status: 'active' },
        }),
        prisma.userCourseProgress.upsert({
          where: { userId_courseId: { userId: enrollment.userId, courseId: enrollment.courseId } },
          create: { userId: enrollment.userId, courseId: enrollment.courseId, status: 'not_started', progressPercent: 0 },
          update: {},
        }),
      ])
    }
    return NextResponse.json({ ok: true, action: 'approved' })
  }

  if (action === 'reject') {
    await prisma.payment.update({ where: { id }, data: { status: 'failed' } })
    if (payment.subscriptionId) {
      await prisma.subscription.update({
        where: { id: payment.subscriptionId },
        data: { status: 'cancelled' },
      })
    }
    // Release reserved coupon so the student can reuse it
    if (payment.certificateId) {
      await prisma.certDiscount.updateMany({
        where: { paymentId: id, usedAt: null },
        data: { paymentId: null },
      })
    }
    // Mark extra course enrollment as rejected
    if (payment.extraCourseEnrollmentId) {
      await prisma.extraCourseEnrollment.update({
        where: { id: payment.extraCourseEnrollmentId },
        data: { status: 'rejected' },
      })
    }
    return NextResponse.json({ ok: true, action: 'rejected' })
  }

  return NextResponse.json({ error: 'Accion invalida' }, { status: 400 })
}
