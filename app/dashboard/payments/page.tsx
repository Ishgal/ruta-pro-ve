import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import DashboardHeader from '@/components/dashboard/DashboardHeader'

export const metadata = { title: 'Mis Pagos | Ruta Pro-VE' }

const METHOD_LABELS: Record<string, string> = {
  pago_movil: 'Pago Movil',
  binance_usdt: 'Binance USDT',
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  pending:  { label: 'En verificacion', classes: 'bg-amber-100 text-amber-700' },
  paid:     { label: 'Aprobado',        classes: 'bg-green-100 text-green-700' },
  failed:   { label: 'Rechazado',       classes: 'bg-red-100 text-red-600'   },
  refunded: { label: 'Reembolsado',     classes: 'bg-gray-100 text-gray-600' },
}

function fmtDate(dt: Date | null | undefined): string {
  if (!dt) return '—'
  return dt.toLocaleDateString('es-VE', {
    timeZone: 'America/Caracas',
    day: '2-digit', month: 'short', year: 'numeric',
  })
}

export default async function PaymentsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const payments = await prisma.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      certificate: { include: { course: { select: { title: true } } } },
      subscription: { select: { plan: true } },
    },
  })

  return (
    <div className="min-h-screen bg-[#F4F6F9]">
      <DashboardHeader />

      <div className="px-4 md:px-6 pb-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-black text-gray-900 mb-1">Mis Pagos</h1>
          <p className="text-sm text-gray-400 mb-6">Historial de transacciones en Ruta Pro-VE</p>

          {payments.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 flex flex-col items-center text-center shadow-sm">
              <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
                </svg>
              </div>
              <p className="text-sm font-medium text-gray-400">Sin pagos aun</p>
              <p className="text-xs text-gray-300 mt-1">Cuando desbloquees un certificado aparecera aqui</p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {payments.map((payment) => {
                const status = STATUS_CONFIG[payment.status ?? 'pending'] ?? STATUS_CONFIG.pending
                const isCert = !!payment.certificate
                const plan = payment.subscription?.plan
                const title = payment.certificate?.course.title
                  ?? (plan ? `Plan ${plan.charAt(0).toUpperCase() + plan.slice(1)}` : 'Pago')
                const dateToShow = payment.paymentDate ?? payment.createdAt

                return (
                  <div key={payment.id} className="bg-white rounded-2xl shadow-sm px-5 py-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isCert ? 'bg-[#E6F8F8]' : 'bg-indigo-50'}`}>
                      {isCert ? (
                        <svg className="w-5 h-5 text-[#00B5B5]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.745 3.745 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.745 3.745 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.745 3.745 0 013.296 1.043 3.745 3.745 0 011.043 3.296A3.745 3.745 0 0121 12z" />
                        </svg>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{title}</p>
                      <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="text-xs text-gray-400">{fmtDate(dateToShow)}</span>
                        <span className="text-xs text-gray-300">·</span>
                        <span className="text-xs text-gray-400">{METHOD_LABELS[payment.method] ?? payment.method}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <p className="text-sm font-bold text-gray-900">${Number(payment.amount).toFixed(2)}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${status.classes}`}>
                        {status.label}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
