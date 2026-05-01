import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { GetUserRoleUseCase } from '@/application/use-cases/user/get-user-role.usecase'
import { PrismaUserRepository } from '@/adapters/repositories/prisma-user.repository'
import AdminPaymentsClient from '@/components/admin/payments/AdminPaymentsClient'

export const metadata = { title: 'Pagos | Admin' }

const PAYMENT_SELECT = {
  id: true,
  amount: true,
  originalAmount: true,
  method: true,
  transactionId: true,
  status: true,
  paymentDate: true,
  exchangeRate: true,
  amountBs: true,
  createdAt: true,
  paidAt: true,
  user: { select: { name: true, email: true } },
  certificate: { select: { course: { select: { title: true } } } },
  subscription: { select: { plan: true } },
} as const

function serialize(p: {
  id: string
  amount: { toString(): string }
  originalAmount: { toString(): string } | null
  method: string
  transactionId: string | null
  status: string
  paymentDate: Date | null
  exchangeRate: { toString(): string } | null
  amountBs: { toString(): string } | null
  createdAt: Date | null
  paidAt: Date | null
  user: { name: string; email: string }
  certificate: { course: { title: string } } | null
  subscription: { plan: string } | null
}) {
  return {
    ...p,
    amount: p.amount.toString(),
    originalAmount: p.originalAmount?.toString() ?? null,
    paymentDate: p.paymentDate?.toISOString() ?? null,
    exchangeRate: p.exchangeRate?.toString() ?? null,
    amountBs: p.amountBs?.toString() ?? null,
    createdAt: p.createdAt?.toISOString() ?? null,
    paidAt: p.paidAt?.toISOString() ?? null,
    type: (p.certificate ? 'certificate' : 'plan') as 'certificate' | 'plan',
  }
}

export default async function AdminPaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const role = await new GetUserRoleUseCase(new PrismaUserRepository()).execute(user.id)
  if (role !== 'admin') redirect('/dashboard')

  const [rawPending, rawHistory] = await Promise.all([
    prisma.payment.findMany({
      where: { status: 'pending' },
      orderBy: { createdAt: 'asc' },
      select: PAYMENT_SELECT,
    }),
    prisma.payment.findMany({
      where: { status: { in: ['paid', 'failed', 'refunded'] } },
      orderBy: { createdAt: 'desc' },
      select: PAYMENT_SELECT,
    }),
  ])

  return (
    <div className="p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">Pagos</h1>
        <p className="text-sm text-gray-500 mt-1">Gestiona y audita todos los pagos de la plataforma</p>
      </div>
      <AdminPaymentsClient
        pending={rawPending.map(serialize)}
        history={rawHistory.map(serialize)}
      />
    </div>
  )
}
