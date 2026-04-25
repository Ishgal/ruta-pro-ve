import { IAdminUserRepository } from '@/application/ports/admin-user.repository.port'

export class ToggleActiveStatusUseCase {
  constructor(private readonly repo: IAdminUserRepository) {}

  async execute(id: string, isActive: boolean): Promise<void> {
    return this.repo.toggleActiveStatus(id, isActive)
  }
}
