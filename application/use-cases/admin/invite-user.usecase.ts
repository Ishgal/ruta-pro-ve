import { IAdminUserRepository, InviteUserDTO } from '@/application/ports/admin-user.repository.port'

export class InviteUserUseCase {
  constructor(private readonly repo: IAdminUserRepository) {}

  async execute(dto: InviteUserDTO) {
    return this.repo.inviteUser(dto)
  }
}
