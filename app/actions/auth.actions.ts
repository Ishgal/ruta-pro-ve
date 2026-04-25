'use server'

import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SupabaseAuthRepository } from '@/adapters/repositories/supabase-auth.repository'
import { RegisterUseCase } from '@/application/use-cases/auth/register.usecase'
import { LoginUseCase } from '@/application/use-cases/auth/login.usecase'
import { PrismaUserRepository } from '@/adapters/repositories/prisma-user.repository'
import { GetUserRoleUseCase } from '@/application/use-cases/user/get-user-role.usecase'

export interface ActionState {
  error?: string
  success?: boolean
}

export async function registerAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const firstName = (formData.get('firstName') as string) ?? ''
  const lastName = (formData.get('lastName') as string) ?? ''
  const fullName = (formData.get('fullName') as string) || `${firstName} ${lastName}`.trim()
  const email = (formData.get('email') as string) ?? ''
  const password = (formData.get('password') as string) ?? ''

  const supabase = await createClient()
  const repo = new SupabaseAuthRepository(supabase)
  const useCase = new RegisterUseCase(repo)

  const result = await useCase.execute({ name: fullName, email, password })

  if (result.error) return { error: result.error }

  redirect('/verify-email')
}

export async function loginAction(
  _prev: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = (formData.get('email') as string) ?? ''
  const password = (formData.get('password') as string) ?? ''

  const supabase = await createClient()
  const repo = new SupabaseAuthRepository(supabase)
  const useCase = new LoginUseCase(repo)

  const result = await useCase.execute({ email, password })

  if (result.error) return { error: result.error }

  const userId = result.user!.id
  const userRepo = new PrismaUserRepository()

  await userRepo.updateLastSignIn(userId).catch(() => {})

  const role = await new GetUserRoleUseCase(userRepo).execute(userId).catch(() => null)

  redirect(role === 'admin' ? '/admin' : '/dashboard')
}

export async function linkedInOAuthAction(): Promise<void> {
  const headersList = await headers()
  const origin = headersList.get('origin') ?? ''
  const redirectTo = `${origin}/api/auth/confirm`

  const supabase = await createClient()
  const repo = new SupabaseAuthRepository(supabase)

  const result = await repo.signInWithLinkedIn(redirectTo)

  if (result.error || !result.url) {
    redirect('/login?error=' + encodeURIComponent(result.error ?? 'Error al conectar con LinkedIn.'))
  }

  redirect(result.url!)
}
