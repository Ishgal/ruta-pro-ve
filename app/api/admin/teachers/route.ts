import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { PrismaUserRepository } from '@/adapters/repositories/prisma-user.repository'
import { SupabaseAdminUserRepository } from '@/adapters/repositories/supabase-admin-user.repository'
import { GetUserRoleUseCase } from '@/application/use-cases/user/get-user-role.usecase'
import { InviteUserUseCase } from '@/application/use-cases/admin/invite-user.usecase'
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

  const teachers = await new GetUsersByRoleUseCase(new SupabaseAdminUserRepository()).execute('docente')
  return NextResponse.json(teachers)
}

export async function POST(request: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { email, name } = await request.json()
  if (!email || !name) {
    return NextResponse.json({ error: 'Email y nombre son requeridos' }, { status: 400 })
  }

  const redirectTo = `${request.nextUrl.origin}/auth/invite-callback`

  const result = await new InviteUserUseCase(new SupabaseAdminUserRepository()).execute({
    email,
    name,
    role: 'docente',
    redirectTo,
  })

  if (!result) {
    return NextResponse.json(
      { error: 'No se pudo crear el docente. El email puede estar ya registrado.' },
      { status: 400 }
    )
  }

  return NextResponse.json({ id: result.id, email: result.email, inviteLink: result.inviteLink }, { status: 201 })
}
