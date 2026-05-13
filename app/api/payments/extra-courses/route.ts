import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { courseId, method, transactionId, paymentDate, exchangeRate, amountBs } = await request.json()

  if (!courseId || !method || !transactionId?.trim() || !paymentDate) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const [course, priceSetting, existingEnrollment] = await Promise.all([
    prisma.course.findFirst({
      where: { id: courseId, isPublished: true },
      select: { id: true, title: true },
    }),
    prisma.appSetting.findUnique({ where: { key: 'course_extra_price' } }),
    prisma.extraCourseEnrollment.findFirst({
      where: { userId: user.id, courseId },
    }),
  ])

  if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  if (existingEnrollment) {
    return NextResponse.json({ error: 'Ya tienes acceso o una solicitud pendiente para este curso' }, { status: 400 })
  }

  const amount = parseFloat(priceSetting?.value ?? '3.00')

  const [enrollment, payment] = await prisma.$transaction(async (tx) => {
    const enroll = await tx.extraCourseEnrollment.create({
      data: { userId: user.id, courseId, status: 'pending' },
    })
    const pay = await tx.payment.create({
      data: {
        userId: user.id,
        extraCourseEnrollmentId: enroll.id,
        amount,
        method,
        status: 'pending',
        transactionId: transactionId.trim(),
        paymentDate: new Date(paymentDate + 'T04:00:00.000Z'),
        exchangeRate: exchangeRate ?? undefined,
        amountBs: amountBs ?? undefined,
      },
    })
    return [enroll, pay]
  })

  return NextResponse.json({ paymentId: payment.id, enrollmentId: enrollment.id })
}
