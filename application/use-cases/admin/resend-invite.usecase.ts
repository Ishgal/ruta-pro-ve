import { IAdminUserRepository } from '@/application/ports/admin-user.repository.port'

export class ResendInviteUseCase {
  constructor(private readonly repo: IAdminUserRepository) {}

  async execute(email: string, redirectTo: string): Promise<string | null> {
    return this.repo.generateNewLink(email, redirectTo)
  }
}
