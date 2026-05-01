import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  return dbUser?.role === 'admin' ? user : null
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const { method, label, details } = await request.json() as {
    method: string; label: string; details: Record<string, string>
  }

  if (!method || !label?.trim()) {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const maxOrder = await prisma.paymentAccount.aggregate({
    _max: { displayOrder: true },
    where: { method },
  })

  const account = await prisma.paymentAccount.create({
    data: {
      method,
      label: label.trim(),
      details: details ?? {},
      displayOrder: (maxOrder._max.displayOrder ?? -1) + 1,
    },
  })

  return NextResponse.json({
    account: {
      id: account.id,
      method: account.method,
      label: account.label,
      isActive: account.isActive,
      displayOrder: account.displayOrder,
      details: account.details as Record<string, string>,
    },
  })
}
