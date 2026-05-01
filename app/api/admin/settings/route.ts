import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (dbUser?.role !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 })

  const { key, value } = await request.json() as { key: string; value: string }
  if (!key || value === undefined || value === '') {
    return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
  }

  const setting = await prisma.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  })

  return NextResponse.json({ ok: true, setting })
}
