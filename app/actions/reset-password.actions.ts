'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

interface ActionState {
  error?: string
  success?: boolean
}

export async function resetPasswordAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  }

  if (!/\d/.test(password)) {
    return { error: 'La contraseña debe contener al menos un número.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: 'No se pudo actualizar la contraseña. El enlace puede haber expirado.' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })

  if (dbUser?.role === 'admin') redirect('/admin')
  if (dbUser?.role === 'docente') redirect('/teacher-dashboard')
  redirect('/dashboard')
}
