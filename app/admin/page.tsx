import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PrismaUserRepository } from '@/adapters/repositories/prisma-user.repository'
import { GetUserRoleUseCase } from '@/application/use-cases/user/get-user-role.usecase'

export default async function AdminPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const repo = new PrismaUserRepository()
  const useCase = new GetUserRoleUseCase(repo)
  const role = await useCase.execute(user.id)

  if (role !== 'admin') redirect('/dashboard')

  return <div className="min-h-screen bg-white" />
}
