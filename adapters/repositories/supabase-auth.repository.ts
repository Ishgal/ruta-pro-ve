import { SupabaseClient } from '@supabase/supabase-js'
import {
  IAuthRepository,
  RegisterDTO,
  LoginDTO,
  AuthResult,
  OAuthResult,
  ForgotPasswordDTO,
  ForgotPasswordResult,
} from '@/application/ports/auth.repository.port'
import { User } from '@/domain/entities/user.entity'

export class SupabaseAuthRepository implements IAuthRepository {
  constructor(private readonly supabase: SupabaseClient) {}

  async register(data: RegisterDTO): Promise<AuthResult> {
    const { data: result, error } = await this.supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name },
      },
    })

    if (error) return { user: null, error: error.message }
    if (!result.user) return { user: null, error: 'No se pudo crear la cuenta.' }

    const user: User = {
      id: result.user.id,
      email: result.user.email!,
      name: data.name,
      role: 'estudiante',
      plan: 'bronce',
    }

    return { user, error: null }
  }

  async login(data: LoginDTO): Promise<AuthResult> {
    const { data: result, error } = await this.supabase.auth.signInWithPassword({
      email: data.email,
      password: data.password,
    })

    if (error) return { user: null, error: 'Correo o contraseña incorrectos.' }
    if (!result.user) return { user: null, error: 'No se pudo iniciar sesión.' }

    const user: User = {
      id: result.user.id,
      email: result.user.email!,
      name: result.user.user_metadata?.name ?? '',
      role: (result.user.user_metadata?.role ?? 'estudiante') as User['role'],
      plan: 'bronce',
    }

    return { user, error: null }
  }

  async signInWithLinkedIn(redirectTo: string): Promise<OAuthResult> {
    const { data, error } = await this.supabase.auth.signInWithOAuth({
      provider: 'linkedin_oidc',
      options: { redirectTo },
    })

    if (error) return { url: null, error: error.message }
    return { url: data.url, error: null }
  }

  async requestPasswordReset(data: ForgotPasswordDTO): Promise<ForgotPasswordResult> {
    const { error } = await this.supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: data.redirectTo,
    })

    if (error) {
      return { error: error.message }
    }

    return { error: null }
  }
}
