import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PrismaUserRepository } from '@/adapters/repositories/prisma-user.repository'
import { SupabaseAdminUserRepository } from '@/adapters/repositories/supabase-admin-user.repository'
import { GetUserRoleUseCase } from '@/application/use-cases/user/get-user-role.usecase'
import { GetUsersByRoleUseCase } from '@/application/use-cases/admin/get-users-by-role.usecase'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const role = await new GetUserRoleUseCase(new PrismaUserRepository()).execute(user.id)
  return role === 'admin' ? user : null
}

export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const students = await new GetUsersByRoleUseCase(new SupabaseAdminUserRepository()).execute('estudiante')
  return NextResponse.json(students)
}
