import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { PrismaUserRepository } from '@/adapters/repositories/prisma-user.repository'
import { SupabaseAdminUserRepository } from '@/adapters/repositories/supabase-admin-user.repository'
import { GetUserRoleUseCase } from '@/application/use-cases/user/get-user-role.usecase'
import { ResendInviteUseCase } from '@/application/use-cases/admin/resend-invite.usecase'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const role = await new GetUserRoleUseCase(new PrismaUserRepository()).execute(user.id)
  if (role !== 'admin') return NextResponse.json({ error: 'No autorizado' }, { status: 403 })

  const { id } = await context.params
  const teacher = await prisma.user.findUnique({ where: { id }, select: { email: true } })
  if (!teacher) return NextResponse.json({ error: 'Docente no encontrado' }, { status: 404 })

  const redirectTo = `${request.nextUrl.origin}/auth/invite-callback`
  const link = await new ResendInviteUseCase(new SupabaseAdminUserRepository()).execute(teacher.email, redirectTo)

  if (!link) return NextResponse.json({ error: 'Error al generar el link' }, { status: 500 })

  return NextResponse.json({ inviteLink: link })
}
