import { IUserRepository } from '@/application/ports/user.repository.port'
import { User } from '@/domain/entities/user.entity'
import { prisma } from '@/lib/prisma'

export class PrismaUserRepository implements IUserRepository {
  async getRoleById(id: string): Promise<User['role'] | null> {
    const row = await prisma.user.findUnique({
      where: { id },
      select: { role: true },
    })
    return (row?.role as User['role']) ?? null
  }

  async updateLastSignIn(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastSignInAt: new Date() },
    })
  }

  async updateSetupStatus(id: string, status: 'pending' | 'active'): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { setupStatus: status as any },
    })
  }
}
