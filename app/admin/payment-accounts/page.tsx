import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { GetUserRoleUseCase } from '@/application/use-cases/user/get-user-role.usecase'
import { PrismaUserRepository } from '@/adapters/repositories/prisma-user.repository'
import PaymentAccountsClient from '@/components/admin/payment-accounts/PaymentAccountsClient'

export const metadata = { title: 'Cuentas de Pago | Admin' }

export default async function PaymentAccountsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = await new GetUserRoleUseCase(new PrismaUserRepository()).execute(user.id)
  if (role !== 'admin') redirect('/dashboard')

  const accounts = await prisma.paymentAccount.findMany({
    orderBy: [{ method: 'asc' }, { displayOrder: 'asc' }],
  })

  const serialized = accounts.map(a => ({
    id: a.id,
    method: a.method,
    label: a.label,
    isActive: a.isActive,
    displayOrder: a.displayOrder,
    details: a.details as Record<string, string>,
  }))

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Cuentas de Pago</h1>
        <p className="text-sm text-gray-500 mt-1">Administra los datos que los estudiantes ven al pagar</p>
      </div>
      <PaymentAccountsClient accounts={serialized} />
    </div>
  )
}
