import { IAuthRepository, LoginDTO, AuthResult } from '@/application/ports/auth.repository.port'

export class LoginUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(data: LoginDTO): Promise<AuthResult> {
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { user: null, error: 'Ingresa un correo electrónico válido.' }
    }
    if (!data.password || data.password.length < 1) {
      return { user: null, error: 'Ingresa tu contraseña.' }
    }

    return this.authRepo.login({
      email: data.email.trim().toLowerCase(),
      password: data.password,
    })
  }
}
