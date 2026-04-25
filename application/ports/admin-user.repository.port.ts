import { User } from '@/domain/entities/user.entity'

export interface InviteUserDTO {
  email: string
  name: string
  role: User['role']
  redirectTo: string
}

export interface IAdminUserRepository {
  inviteUser(dto: InviteUserDTO): Promise<{ id: string; email: string; inviteLink: string } | null>
  generateNewLink(email: string, redirectTo: string): Promise<string | null>
  getUsersByRole(role: User['role']): Promise<User[]>
  deleteUser(id: string): Promise<void>
  toggleActiveStatus(id: string, isActive: boolean): Promise<void>
}
