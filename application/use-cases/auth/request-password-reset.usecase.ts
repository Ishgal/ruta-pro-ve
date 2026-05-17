import {
  IAuthRepository,
  ForgotPasswordDTO,
  ForgotPasswordResult,
} from '@/application/ports/auth.repository.port'

export class RequestPasswordResetUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(data: ForgotPasswordDTO): Promise<ForgotPasswordResult> {
    const email = data.email?.trim().toLowerCase()

    if (!email) {
      return { error: 'El correo electrónico es requerido.' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: 'Ingresa un correo electrónico válido.' }
    }

    return this.authRepo.requestPasswordReset({
      email,
      redirectTo: data.redirectTo,
    })
  }
}
