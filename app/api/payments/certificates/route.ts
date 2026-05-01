import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { certificateId, method, transactionId, certDiscountId, paymentDate, exchangeRate, amountBs } = await request.json()

  if (!certificateId || !method || !transactionId?.trim() || !paymentDate) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const [cert, priceSetting] = await Promise.all([
    prisma.certificate.findFirst({
      where: { id: certificateId, userId: user.id },
      select: { id: true, pdfUrl: true },
    }),
    prisma.appSetting.findUnique({ where: { key: 'certificate_price' } }),
  ])

  if (!cert) return NextResponse.json({ error: 'Certificado no encontrado' }, { status: 404 })
  if (cert.pdfUrl) return NextResponse.json({ error: 'Certificado ya desbloqueado' }, { status: 400 })

  const existing = await prisma.payment.findFirst({
    where: { userId: user.id, certificateId, status: 'pending' },
  })
  if (existing) return NextResponse.json({ error: 'Ya tienes un pago pendiente para este certificado' }, { status: 400 })

  const basePrice = parseFloat(priceSetting?.value ?? '5.00')

  // Validate and apply coupon
  let finalAmount = basePrice
  let coupon: { id: string; discountPct: number } | null = null

  if (certDiscountId) {
    const discount = await prisma.certDiscount.findFirst({
      where: {
        id: certDiscountId,
        userId: user.id,
        usedAt: null,
        paymentId: null,
        expiresAt: { gt: new Date() },
      },
    })
    if (!discount) return NextResponse.json({ error: 'Cupon invalido o expirado' }, { status: 400 })
    coupon = { id: discount.id, discountPct: discount.discountPct }
    finalAmount = parseFloat((basePrice * (1 - discount.discountPct / 100)).toFixed(2))
  }

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      certificateId,
      amount: finalAmount,
      originalAmount: coupon ? basePrice : undefined,
      method,
      status: 'pending',
      transactionId: transactionId.trim(),
      paymentDate: new Date(paymentDate + 'T04:00:00.000Z'),
      exchangeRate: exchangeRate ?? undefined,
      amountBs: amountBs ?? undefined,
    },
  })

  // Reserve the coupon (link to payment, but don't mark usedAt yet — admin sets that on approval)
  if (coupon) {
    await prisma.certDiscount.update({
      where: { id: coupon.id },
      data: { paymentId: payment.id },
    })
  }

  return NextResponse.json({ paymentId: payment.id })
}
