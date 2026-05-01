'use client'

import { useState } from 'react'

export type PaymentRow = {
  id: string
  amount: string
  originalAmount: string | null
  method: string
  transactionId: string | null
  status: string
  paymentDate: string | null
  exchangeRate: string | null
  amountBs: string | null
  createdAt: string | null
  paidAt: string | null
  type: 'certificate' | 'plan'
  user: { name: string; email: string }
  certificate: { course: { title: string } } | null
  subscription: { plan: string } | null
}

type Tab = 'pending' | 'history'

const PLAN_LABELS: Record<string, string> = { plata: 'Plan Plata', oro: 'Plan Oro' }
const METHOD_LABELS: Record<string, string> = { pago_movil: 'Pago Movil', binance_usdt: 'Binance USDT' }
const STATUS_STYLE: Record<string, string> = {
  paid: 'bg-green-50 text-green-700',
  failed: 'bg-red-50 text-red-600',
  refunded: 'bg-gray-100 text-gray-600',
  pending: 'bg-amber-50 text-amber-700',
}
const STATUS_LABEL: Record<string, string> = {
  paid: 'Aprobado',
  failed: 'Rechazado',
  refunded: 'Reembolsado',
  pending: 'Pendiente',
}

const PAGE_SIZE = 10

// Formato venezolano: coma decimal, punto miles
function fmtVE(n: number, decimals = 2): string {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(n)
}

// Timestamp compacto en hora venezolana (UTC-4)
function fmt(iso: string | null) {
  if (!iso) return '—'
  return new Date(iso).toLocaleString('es-VE', {
    timeZone: 'America/Caracas',
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit',
    hour12: false,
  })
}

// Solo fecha — extrae los primeros 10 chars del ISO (YYYY-MM-DD) sin conversión de zona
function fmtDate(iso: string | null) {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

function TypeBadge({ p }: { p: PaymentRow }) {
  if (p.type === 'plan') {
    return (
      <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap">
        {PLAN_LABELS[p.subscription?.plan ?? ''] ?? 'Plan'}
      </span>
    )
  }
  return (
    <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wide whitespace-nowrap">
      Certificado
    </span>
  )
}

function Pagination({
  page, total, onChange,
}: {
  page: number
  total: number
  onChange: (p: number) => void
}) {
  const totalPages = Math.ceil(total / PAGE_SIZE)
  if (totalPages <= 1) return null
  return (
    <div className="flex items-center justify-between px-5 py-3.5 border-t border-gray-100">
      <p className="text-xs text-gray-400">{total} registros · Página {page} de {totalPages}</p>
      <div className="flex gap-1.5">
        <button
          disabled={page === 1}
          onClick={() => onChange(page - 1)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
        >
          Anterior
        </button>
        <button
          disabled={page === totalPages}
          onClick={() => onChange(page + 1)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 disabled:opacity-30 hover:bg-gray-50 transition-colors"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}

const TH = 'text-left px-4 py-3.5 font-semibold text-gray-500 text-[11px] uppercase tracking-wide whitespace-nowrap'
const TD = 'px-4 py-3.5'

export default function AdminPaymentsClient({
  pending: initialPending,
  history: initialHistory,
}: {
  pending: PaymentRow[]
  history: PaymentRow[]
}) {
  const [tab, setTab] = useState<Tab>('pending')
  const [pending, setPending] = useState(initialPending)
  const [history, setHistory] = useState(initialHistory)
  const [loading, setLoading] = useState<string | null>(null)
  const [pendingPage, setPendingPage] = useState(1)
  const [historyPage, setHistoryPage] = useState(1)

  async function act(id: string, action: 'approve' | 'reject') {
    setLoading(id)
    try {
      const res = await fetch(`/api/admin/payments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })
      if (res.ok) {
        const payment = pending.find(p => p.id === id)
        setPending(prev => {
          const next = prev.filter(p => p.id !== id)
          setPendingPage(page => Math.min(page, Math.max(1, Math.ceil(next.length / PAGE_SIZE))))
          return next
        })
        if (payment) {
          setHistory(prev => [{
            ...payment,
            status: action === 'approve' ? 'paid' : 'failed',
            paidAt: new Date().toISOString(),
          }, ...prev])
        }
      }
    } finally {
      setLoading(null)
    }
  }

  const pendingSlice = pending.slice((pendingPage - 1) * PAGE_SIZE, pendingPage * PAGE_SIZE)
  const historySlice = history.slice((historyPage - 1) * PAGE_SIZE, historyPage * PAGE_SIZE)

  return (
    <div>
      {/* Tabs */}
      <div className="flex gap-1 mb-5 bg-gray-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab('pending')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Pendientes
          {pending.length > 0 && (
            <span className="bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {pending.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            tab === 'history' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Historial
          <span className="text-gray-400 text-[11px] font-medium">{history.length}</span>
        </button>
      </div>

      {/* ── Pendientes ── */}
      {tab === 'pending' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {pending.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="font-semibold text-gray-700">Sin pagos pendientes</p>
              <p className="text-sm text-gray-400">Todos los pagos han sido procesados</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className={TH}>ID</th>
                      <th className={TH}>Usuario</th>
                      <th className={TH}>Tipo</th>
                      <th className={TH}>Monto USD</th>
                      <th className={TH}>Tasa / Bs.</th>
                      <th className={TH}>Método</th>
                      <th className={TH}>Referencia</th>
                      <th className={TH}>Fecha pago</th>
                      <th className={TH}>Registrado</th>
                      <th className={`${TH} text-right`}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {pendingSlice.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className={`${TD} font-mono text-[11px] text-gray-400`}>{p.id.slice(0, 8)}</td>
                        <td className={TD}>
                          <p className="font-medium text-gray-900 text-xs">{p.user.name}</p>
                          <p className="text-[11px] text-gray-400">{p.user.email}</p>
                        </td>
                        <td className={TD}>
                          <TypeBadge p={p} />
                          {p.certificate && (
                            <p className="text-[11px] text-gray-400 mt-1 max-w-[150px] truncate">
                              {p.certificate.course.title}
                            </p>
                          )}
                        </td>
                        <td className={`${TD} text-xs font-semibold text-gray-900 whitespace-nowrap`}>
                          ${p.amount}
                          {p.originalAmount && p.originalAmount !== p.amount && (
                            <span className="block text-[10px] text-gray-400 font-normal line-through">
                              ${p.originalAmount}
                            </span>
                          )}
                        </td>
                        <td className={`${TD} text-[11px] whitespace-nowrap`}>
                          {p.exchangeRate ? (
                            <>
                              {p.amountBs && <span className="block font-bold text-gray-900">{fmtVE(parseFloat(p.amountBs))} Bs.</span>}
                              <span className="block text-gray-400">{fmtVE(parseFloat(p.exchangeRate))} Bs/$</span>
                            </>
                          ) : '—'}
                        </td>
                        <td className={`${TD} text-xs text-gray-600 whitespace-nowrap`}>
                          {METHOD_LABELS[p.method] ?? p.method}
                        </td>
                        <td className={`${TD} font-mono text-[11px] text-gray-600`}>
                          {p.transactionId ?? '—'}
                        </td>
                        <td className={`${TD} text-[11px] text-gray-500 whitespace-nowrap`}>
                          {fmtDate(p.paymentDate)}
                        </td>
                        <td className={`${TD} text-[11px] text-gray-500 whitespace-nowrap`}>
                          {fmt(p.createdAt)}
                        </td>
                        <td className={`${TD} text-right`}>
                          <div className="flex gap-2 justify-end">
                            <button
                              disabled={!!loading}
                              onClick={() => act(p.id, 'reject')}
                              className="px-3 py-1.5 rounded-lg border border-red-200 text-red-500 text-[11px] font-semibold hover:bg-red-50 transition-colors disabled:opacity-40"
                            >
                              Rechazar
                            </button>
                            <button
                              disabled={!!loading}
                              onClick={() => act(p.id, 'approve')}
                              className="px-3 py-1.5 rounded-lg bg-[#1B4F8C] text-white text-[11px] font-semibold hover:bg-[#163e6e] transition-colors disabled:opacity-40"
                            >
                              {loading === p.id ? 'Procesando...' : 'Aprobar'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={pendingPage} total={pending.length} onChange={p => { setPendingPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
            </>
          )}
        </div>
      )}

      {/* ── Historial ── */}
      {tab === 'history' && (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16">
              <p className="text-sm text-gray-400">Sin historial de pagos todavía.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className={TH}>ID</th>
                      <th className={TH}>Usuario</th>
                      <th className={TH}>Tipo</th>
                      <th className={TH}>Monto USD</th>
                      <th className={TH}>Tasa / Bs.</th>
                      <th className={TH}>Método</th>
                      <th className={TH}>Referencia</th>
                      <th className={TH}>Fecha pago</th>
                      <th className={TH}>Registrado</th>
                      <th className={TH}>Procesado</th>
                      <th className={TH}>Estado</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {historySlice.map(p => (
                      <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className={`${TD} font-mono text-[11px] text-gray-400`}>{p.id.slice(0, 8)}</td>
                        <td className={TD}>
                          <p className="font-medium text-gray-900 text-xs">{p.user.name}</p>
                          <p className="text-[11px] text-gray-400">{p.user.email}</p>
                        </td>
                        <td className={TD}>
                          <TypeBadge p={p} />
                          {p.certificate && (
                            <p className="text-[11px] text-gray-400 mt-1 max-w-[150px] truncate">
                              {p.certificate.course.title}
                            </p>
                          )}
                        </td>
                        <td className={`${TD} text-xs font-semibold text-gray-900 whitespace-nowrap`}>
                          ${p.amount}
                          {p.originalAmount && p.originalAmount !== p.amount && (
                            <span className="block text-[10px] text-gray-400 font-normal line-through">
                              ${p.originalAmount}
                            </span>
                          )}
                        </td>
                        <td className={`${TD} text-[11px] whitespace-nowrap`}>
                          {p.exchangeRate ? (
                            <>
                              {p.amountBs && <span className="block font-bold text-gray-900">{fmtVE(parseFloat(p.amountBs))} Bs.</span>}
                              <span className="block text-gray-400">{fmtVE(parseFloat(p.exchangeRate))} Bs/$</span>
                            </>
                          ) : '—'}
                        </td>
                        <td className={`${TD} text-xs text-gray-600 whitespace-nowrap`}>
                          {METHOD_LABELS[p.method] ?? p.method}
                        </td>
                        <td className={`${TD} font-mono text-[11px] text-gray-600`}>
                          {p.transactionId ?? '—'}
                        </td>
                        <td className={`${TD} text-[11px] text-gray-500 whitespace-nowrap`}>
                          {fmtDate(p.paymentDate)}
                        </td>
                        <td className={`${TD} text-[11px] text-gray-500 whitespace-nowrap`}>
                          {fmt(p.createdAt)}
                        </td>
                        <td className={`${TD} text-[11px] text-gray-500 whitespace-nowrap`}>
                          {fmt(p.paidAt)}
                        </td>
                        <td className={TD}>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_STYLE[p.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABEL[p.status] ?? p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination page={historyPage} total={history.length} onChange={p => { setHistoryPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
            </>
          )}
        </div>
      )}
    </div>
  )
}
