'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PrismaUserRepository } from '@/adapters/repositories/prisma-user.repository'
import { GetUserRoleUseCase } from '@/application/use-cases/user/get-user-role.usecase'

export interface SetPasswordState {
  error?: string
}

export async function setPasswordAction(
  _prev: SetPasswordState,
  formData: FormData
): Promise<SetPasswordState> {
  const password = formData.get('password') as string
  const confirm = formData.get('confirm') as string

  if (!password || password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres' }
  }
  if (password !== confirm) {
    return { error: 'Las contraseñas no coinciden' }
  }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { error } = await supabase.auth.updateUser({ password })
  if (error) return { error: error.message }

  const userRepo = new PrismaUserRepository()
  await userRepo.updateSetupStatus(user.id, 'active').catch(() => {})
  await userRepo.updateLastSignIn(user.id).catch(() => {})

  const role = await new GetUserRoleUseCase(userRepo).execute(user.id).catch(() => null)
  redirect(role === 'admin' ? '/admin' : '/dashboard')
}
