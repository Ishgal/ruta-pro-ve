import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { PrismaUserRepository } from '@/adapters/repositories/prisma-user.repository'
import { SupabaseAdminUserRepository } from '@/adapters/repositories/supabase-admin-user.repository'
import { GetUserRoleUseCase } from '@/application/use-cases/user/get-user-role.usecase'
import { GetUsersByRoleUseCase } from '@/application/use-cases/admin/get-users-by-role.usecase'
import UsersTableClient from '@/components/admin/shared/UsersTableClient'

export default async function TeachersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = await new GetUserRoleUseCase(new PrismaUserRepository()).execute(user.id)
  if (role !== 'admin') redirect('/dashboard')

  const teachers = await new GetUsersByRoleUseCase(new SupabaseAdminUserRepository()).execute('docente')

  return (
    <UsersTableClient
      title="Docentes"
      singularLabel="docente"
      initialUsers={teachers}
      apiBase="/api/admin/teachers"
      canInvite
      canToggleActive
    />
  )
}
