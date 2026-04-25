import { User } from '@/domain/entities/user.entity'

export interface IUserRepository {
  getRoleById(id: string): Promise<User['role'] | null>
  updateLastSignIn(id: string): Promise<void>
  updateSetupStatus(id: string, status: 'pending' | 'active'): Promise<void>
}
