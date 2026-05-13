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

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const badges = await prisma.badge.findMany({
    orderBy: [{ conditionType: 'asc' }, { conditionValue: 'asc' }],
    include: { _count: { select: { userBadges: true } } }
  })

  return NextResponse.json(badges)
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const body = await req.json()
  const { name, description, conditionType, conditionValue, iconUrl } = body

  if (!name?.trim() || !conditionType) {
    return NextResponse.json({ error: 'Nombre y tipo de condición son requeridos' }, { status: 400 })
  }

  const badge = await prisma.badge.create({
    data: {
      name: name.trim(),
      description: description?.trim() || null,
      conditionType,
      conditionValue: conditionValue ? Number(conditionValue) : null,
      iconUrl: iconUrl?.trim() || null,
    },
    include: { _count: { select: { userBadges: true } } }
  })

  return NextResponse.json({ badge }, { status: 201 })
}
