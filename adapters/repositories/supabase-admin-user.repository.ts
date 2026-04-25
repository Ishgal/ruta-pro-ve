import { supabaseAdmin } from '@/lib/supabase/admin'
import { prisma } from '@/lib/prisma'
import { IAdminUserRepository, InviteUserDTO } from '@/application/ports/admin-user.repository.port'
import { User } from '@/domain/entities/user.entity'

export class SupabaseAdminUserRepository implements IAdminUserRepository {
  async inviteUser(dto: InviteUserDTO): Promise<{ id: string; email: string; inviteLink: string } | null> {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'invite',
      email: dto.email,
      options: {
        redirectTo: dto.redirectTo,
        data: { name: dto.name },
      },
    })

    if (error || !data.user) {
      console.error('[inviteUser] Supabase error:', error?.message, error?.status)
      return null
    }

    await prisma.user.upsert({
      where: { id: data.user.id },
      update: { role: dto.role as any, name: dto.name, setupStatus: 'pending' },
      create: {
        id: data.user.id,
        email: dto.email,
        name: dto.name,
        role: dto.role as any,
        setupStatus: 'pending',
      },
    })

    return { id: data.user.id, email: dto.email, inviteLink: data.properties.action_link }
  }

  async generateNewLink(email: string, redirectTo: string): Promise<string | null> {
    // Para usuarios que ya existen, generamos un link de recuperación (equivalente funcional)
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    })

    if (error || !data.properties.action_link) {
      console.error('[generateNewLink] Supabase error:', error?.message)
      return null
    }

    return data.properties.action_link
  }

  async getUsersByRole(role: User['role']): Promise<User[]> {
    const rows = await prisma.user.findMany({
      where: { role: role as any },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscription: true,
        setupStatus: true,
        isActive: true,
        avatarUrl: true,
        createdAt: true,
      },
    })

    return rows.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role as User['role'],
      subscription: u.subscription as User['subscription'],
      setupStatus: u.setupStatus as User['setupStatus'],
      isActive: u.isActive,
      avatarUrl: u.avatarUrl ?? undefined,
      createdAt: u.createdAt?.toISOString(),
    }))
  }

  async deleteUser(id: string): Promise<void> {
    await supabaseAdmin.auth.admin.deleteUser(id)
    await prisma.user.delete({ where: { id } }).catch(() => {})
  }

  async toggleActiveStatus(id: string, isActive: boolean): Promise<void> {
    await prisma.user.update({ where: { id }, data: { isActive } })
  }
}
