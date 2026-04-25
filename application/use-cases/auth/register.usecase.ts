import { IAuthRepository, RegisterDTO, AuthResult } from '@/application/ports/auth.repository.port'

export class RegisterUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(data: RegisterDTO): Promise<AuthResult> {
    if (!data.name || data.name.trim().length < 2) {
      return { user: null, error: 'El nombre debe tener al menos 2 caracteres.' }
    }
    if (!data.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
      return { user: null, error: 'Ingresa un correo electrónico válido.' }
    }
    if (!data.password || data.password.length < 8) {
      return { user: null, error: 'La contraseña debe tener al menos 8 caracteres.' }
    }
    if (!/[0-9]/.test(data.password)) {
      return { user: null, error: 'La contraseña debe incluir al menos un número.' }
    }

    return this.authRepo.register({
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
    })
  }
}
