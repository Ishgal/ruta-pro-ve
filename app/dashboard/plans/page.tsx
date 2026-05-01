import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import PlansClient from '@/components/dashboard/PlansClient'

export const metadata = { title: 'Planes | Ruta Pro-VE' }

export default async function PlansPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [dbUser, settings, activeAccounts] = await Promise.all([
    prisma.user.findUnique({ where: { id: user.id }, select: { plan: true } }),
    prisma.appSetting.findMany({
      where: { key: { in: ['plan_price_plata', 'plan_price_oro', 'plan_discount_pct_plata', 'plan_discount_pct_oro', 'plan_coupons_plata', 'plan_coupons_oro'] } },
    }),
    prisma.paymentAccount.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, method: true, label: true, details: true },
    }),
  ])

  if (!dbUser) redirect('/login')

  const s = Object.fromEntries(settings.map(x => [x.key, x.value]))

  const plans = {
    current: dbUser.plan,
    plata: {
      price: s.plan_price_plata ?? '5.00',
      discountPct: s.plan_discount_pct_plata ?? '50',
      coupons: s.plan_coupons_plata ?? '1',
    },
    oro: {
      price: s.plan_price_oro ?? '10.00',
      discountPct: s.plan_discount_pct_oro ?? '30',
      coupons: s.plan_coupons_oro ?? '2',
    },
  }

  const accounts = activeAccounts.map(a => ({
    ...a,
    details: a.details as Record<string, string>,
  }))

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <DashboardHeader />
      <div className="px-4 md:px-8 py-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900">Elige tu plan</h1>
          <p className="text-gray-500 mt-2 text-sm">Accede a beneficios exclusivos y acelera tu formacion profesional</p>
        </div>
        <PlansClient plans={plans} paymentAccounts={accounts} />
      </div>
    </div>
  )
}
