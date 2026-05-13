import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { email: user.email! }, select: { role: true } })
  return dbUser?.role === 'admin' ? user : null
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  const body = await req.json()
  const { name, description, conditionType, conditionValue, iconUrl } = body

  const badge = await prisma.badge.update({
    where: { id },
    data: {
      ...(name !== undefined && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() || null }),
      ...(conditionType !== undefined && { conditionType }),
      ...(conditionValue !== undefined && { conditionValue: conditionValue !== '' ? Number(conditionValue) : null }),
      ...(iconUrl !== undefined && { iconUrl: iconUrl?.trim() || null }),
    },
    include: { _count: { select: { userBadges: true } } }
  })

  return NextResponse.json({ badge })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await params
  await prisma.badge.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
