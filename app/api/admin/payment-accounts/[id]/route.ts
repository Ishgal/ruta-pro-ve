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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const { id } = await params
  const body = await request.json() as { isActive?: boolean; label?: string; details?: Record<string, string> }

  const updated = await prisma.paymentAccount.update({
    where: { id },
    data: {
      ...(body.isActive !== undefined && { isActive: body.isActive }),
      ...(body.label && { label: body.label }),
      ...(body.details && { details: body.details }),
    },
  })

  return NextResponse.json({ ok: true, account: updated })
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const { id } = await params
  await prisma.paymentAccount.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
