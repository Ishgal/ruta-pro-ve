import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PrismaUserRepository } from '@/adapters/repositories/prisma-user.repository'
import { SupabaseAdminUserRepository } from '@/adapters/repositories/supabase-admin-user.repository'
import { GetUserRoleUseCase } from '@/application/use-cases/user/get-user-role.usecase'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const role = await new GetUserRoleUseCase(new PrismaUserRepository()).execute(user.id)
  return role === 'admin' ? user : null
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await context.params
  const { name } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })

  const updated = await prisma.user.update({
    where: { id },
    data: { name: name.trim() },
    select: { id: true, name: true, email: true, role: true, subscription: true, setupStatus: true, createdAt: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await context.params
  await new SupabaseAdminUserRepository().deleteUser(id)

  return NextResponse.json({ success: true })
}
