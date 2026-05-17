import { User } from '@/domain/entities/user.entity'

export interface RegisterDTO {
  name: string
  email: string
  password: string
}

export interface LoginDTO {
  email: string
  password: string
}

export interface AuthResult {
  user: User | null
  error: string | null
}

export interface OAuthResult {
  url: string | null
  error: string | null
}

export interface ForgotPasswordDTO {
  email: string
  redirectTo: string
}

export interface ForgotPasswordResult {
  error: string | null
}

export interface IAuthRepository {
  register(data: RegisterDTO): Promise<AuthResult>
  login(data: LoginDTO): Promise<AuthResult>
  signInWithLinkedIn(redirectTo: string): Promise<OAuthResult>
  requestPasswordReset(data: ForgotPasswordDTO): Promise<ForgotPasswordResult>
}
