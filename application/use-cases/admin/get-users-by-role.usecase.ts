import { IAdminUserRepository } from '@/application/ports/admin-user.repository.port'
import { User } from '@/domain/entities/user.entity'

export class GetUsersByRoleUseCase {
  constructor(private readonly repo: IAdminUserRepository) {}

  async execute(role: User['role']): Promise<User[]> {
    return this.repo.getUsersByRole(role)
  }
}
