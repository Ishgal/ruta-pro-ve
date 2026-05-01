import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PaymentMethod } from '@/app/generated/prisma'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { plan, method, transactionId, paymentDate, exchangeRate, amountBs } = await request.json() as {
    plan: 'plata' | 'oro'; method: string; transactionId: string
    paymentDate: string; exchangeRate?: number; amountBs?: number
  }

  if (!plan || !method || !transactionId?.trim() || !paymentDate) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }
  if (!['plata', 'oro'].includes(plan)) {
    return NextResponse.json({ error: 'Plan invalido' }, { status: 400 })
  }

  // No pending plan payment already
  const existing = await prisma.payment.findFirst({
    where: {
      userId: user.id,
      status: 'pending',
      subscription: { plan },
    },
  })
  if (existing) return NextResponse.json({ error: 'Ya tienes un pago pendiente para este plan' }, { status: 400 })

  const priceKey = plan === 'plata' ? 'plan_price_plata' : 'plan_price_oro'
  const priceSetting = await prisma.appSetting.findUnique({ where: { key: priceKey } })
  const amount = parseFloat(priceSetting?.value ?? (plan === 'plata' ? '5.00' : '10.00'))

  // Create subscription record (pending until payment approved)
  const subscription = await prisma.subscription.create({
    data: { userId: user.id, plan, status: 'active' },
  })

  const payment = await prisma.payment.create({
    data: {
      userId: user.id,
      subscriptionId: subscription.id,
      amount,
      method: method as PaymentMethod,
      status: 'pending',
      transactionId: transactionId.trim(),
      paymentDate: new Date(paymentDate + 'T04:00:00.000Z'),
      exchangeRate: exchangeRate ?? undefined,
      amountBs: amountBs ?? undefined,
    },
  })

  return NextResponse.json({ paymentId: payment.id })
}
