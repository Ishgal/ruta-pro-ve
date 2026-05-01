import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { GetUserRoleUseCase } from '@/application/use-cases/user/get-user-role.usecase'
import { PrismaUserRepository } from '@/adapters/repositories/prisma-user.repository'
import AdminSettingsClient from '@/components/admin/settings/AdminSettingsClient'

export const metadata = { title: 'Configuracion | Admin' }

export default async function AdminSettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = await new GetUserRoleUseCase(new PrismaUserRepository()).execute(user.id)
  if (role !== 'admin') redirect('/dashboard')

  const settings = await prisma.appSetting.findMany({ orderBy: { key: 'asc' } })

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Configuracion</h1>
        <p className="text-sm text-gray-500 mt-1">Precios y parametros globales de la plataforma</p>
      </div>
      <AdminSettingsClient settings={settings.map(s => ({ key: s.key, value: s.value, label: s.label ?? s.key }))} />
    </div>
  )
}
