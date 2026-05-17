'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SupabaseAuthRepository } from '@/adapters/repositories/supabase-auth.repository'
import { RequestPasswordResetUseCase } from '@/application/use-cases/auth/request-password-reset.usecase'

interface ActionState {
  error?: string
  success?: boolean
}

export async function forgotPasswordAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get('email') as string

  const headersList = await headers()
  const origin = headersList.get('origin') || ''
  const redirectTo = `${origin}/auth/reset-callback`

  const supabase = await createClient()
  const authRepo = new SupabaseAuthRepository(supabase)
  const useCase = new RequestPasswordResetUseCase(authRepo)

  const result = await useCase.execute({ email, redirectTo })

  if (result.error) {
    return { error: result.error }
  }

  return { success: true }
}
