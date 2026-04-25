import { User } from '@/domain/entities/user.entity'
import { IUserRepository } from '@/application/ports/user.repository.port'

export class GetUserRoleUseCase {
  constructor(private readonly repo: IUserRepository) {}

  async execute(userId: string): Promise<User['role'] | null> {
    return this.repo.getRoleById(userId)
  }
}
