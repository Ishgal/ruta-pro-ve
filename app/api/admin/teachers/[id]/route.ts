import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PrismaUserRepository } from '@/adapters/repositories/prisma-user.repository'
import { SupabaseAdminUserRepository } from '@/adapters/repositories/supabase-admin-user.repository'
import { GetUserRoleUseCase } from '@/application/use-cases/user/get-user-role.usecase'
import { ToggleActiveStatusUseCase } from '@/application/use-cases/admin/toggle-active-status.usecase'

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
  const body = await request.json()

  if (typeof body.isActive === 'boolean') {
    await new ToggleActiveStatusUseCase(new SupabaseAdminUserRepository()).execute(id, body.isActive)
    return NextResponse.json({ success: true })
  }

  if (body.name?.trim()) {
    const updated = await prisma.user.update({
      where: { id },
      data: { name: body.name.trim() },
      select: { id: true, name: true, email: true, role: true, plan: true, setupStatus: true, isActive: true, createdAt: true },
    })
    return NextResponse.json(updated)
  }

  return NextResponse.json({ error: 'Payload inválido' }, { status: 400 })
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { id } = await context.params

  const user = await prisma.user.findUnique({ where: { id }, select: { id: true } })
  if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  // Eliminar de Prisma (cascade eliminará teacher, teacherAssignments, etc.)
  await prisma.user.delete({ where: { id } })
  // Eliminar de Supabase Auth
  await new SupabaseAdminUserRepository().deleteUser(id)

  return NextResponse.json({ success: true })
}