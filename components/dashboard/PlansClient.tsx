'use client'

import { useState, useEffect } from 'react'

type PlanInfo = { price: string; discountPct: string; coupons: string }
type Plans = { current: string; plata: PlanInfo; oro: PlanInfo }
type PaymentAccount = { id: string; method: string; label: string; details: Record<string, string> }
type PaymentMethod = 'pago_movil' | 'binance_usdt'

function formatBcvDate(iso: string): string {
  const [year, month, day] = iso.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function formatBs(n: number): string {
  const [int, dec] = n.toFixed(2).split('.')
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec
}

export default function PlansClient({ plans, paymentAccounts }: { plans: Plans; paymentAccounts: PaymentAccount[] }) {
  const [selecting, setSelecting] = useState<'plata' | 'oro' | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('pago_movil')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [reference, setReference] = useState('')
  const [paymentDate, setPaymentDate] = useState(todayStr())
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [bcvRate, setBcvRate] = useState<number | null>(null)
  const [bcvDate, setBcvDate] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/bcv-rate').then(r => r.json()).then(d => {
      setBcvRate(d.rate); setBcvDate(d.updatedAt)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (selecting) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [selecting])

  const planData = selecting ? plans[selecting] : null
  const accountsForMethod = paymentAccounts.filter(a => a.method === method)
  const selectedAccount = accountsForMethod.find(a => a.id === selectedAccountId) ?? accountsForMethod[0]

  function openModal(plan: 'plata' | 'oro') {
    const firstMethod = paymentAccounts[0]?.method as PaymentMethod ?? 'pago_movil'
    setSelecting(plan)
    setMethod(firstMethod)
    setSelectedAccountId(paymentAccounts.find(a => a.method === firstMethod)?.id ?? '')
    setReference('')
    setPaymentDate(todayStr())
    setDone(false)
  }

  async function submit() {
    if (!selecting || !reference.trim() || !paymentDate) return
    setSubmitting(true)
    try {
      const price = planData ? parseFloat(planData.price) : 0
      const res = await fetch('/api/payments/plans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plan: selecting,
          method,
          transactionId: reference.trim(),
          paymentDate,
          exchangeRate: method === 'pago_movil' && bcvRate ? bcvRate : undefined,
          amountBs: method === 'pago_movil' && bcvRate ? parseFloat((price * bcvRate).toFixed(2)) : undefined,
        }),
      })
      if (res.ok) setDone(true)
    } finally {
      setSubmitting(false)
    }
  }

  const PLAN_CARDS = [
    {
      key: 'bronce' as const,
      name: 'Bronce',
      price: 'Gratis',
      color: 'border-amber-300',
      badge: 'bg-amber-100 text-amber-700',
      features: ['Acceso a todos los cursos', 'Progreso y niveles', 'Insignias', 'Anuncios incluidos'],
      cta: null,
    },
    {
      key: 'plata' as const,
      name: 'Plata',
      price: `$${plans.plata.price}/mes`,
      color: 'border-slate-400',
      badge: 'bg-slate-100 text-slate-700',
      features: [
        'Todo lo de Bronce',
        'Sin anuncios',
        `${plans.plata.coupons} certificado con ${plans.plata.discountPct}% descuento por mes`,
      ],
      cta: 'Suscribirse a Plata',
    },
    {
      key: 'oro' as const,
      name: 'Oro',
      price: `$${plans.oro.price}/mes`,
      color: 'border-yellow-400',
      badge: 'bg-yellow-100 text-yellow-700',
      features: [
        'Todo lo de Bronce',
        'Sin anuncios',
        `${plans.oro.coupons} certificados con ${plans.oro.discountPct}% descuento por mes`,
        'Acceso a mentorias con docentes',
      ],
      cta: 'Suscribirse a Oro',
    },
  ]

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {PLAN_CARDS.map(card => {
          const isCurrent = plans.current === card.key
          const isHigher = (card.key === 'oro' && plans.current !== 'oro') ||
                           (card.key === 'plata' && plans.current === 'bronce')
          return (
            <div key={card.key} className={`bg-white rounded-2xl border-2 shadow-sm flex flex-col p-6 ${
              isCurrent ? 'border-[#1B4F8C] ring-2 ring-[#1B4F8C]/20' : card.color
            }`}>
              {isCurrent && (
                <span className="self-start text-[10px] font-black bg-[#1B4F8C] text-white px-2.5 py-1 rounded-full uppercase tracking-widest mb-4">
                  Tu plan actual
                </span>
              )}
              <span className={`self-start text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-widest mb-3 ${card.badge}`}>
                {card.name}
              </span>
              <p className="text-3xl font-black text-gray-900 mb-1">{card.price}</p>
              <p className="text-xs text-gray-400 mb-6">
                {card.key === 'bronce' ? 'Para siempre' : 'Renovacion mensual'}
              </p>
              <ul className="flex flex-col gap-2.5 flex-1 mb-6">
                {card.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-sm text-gray-600">
                    <svg className="w-4 h-4 text-green-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {f}
                  </li>
                ))}
              </ul>
              {card.cta && !isCurrent && (
                <button
                  onClick={() => openModal(card.key as 'plata' | 'oro')}
                  disabled={!isHigher}
                  className={`w-full py-3 rounded-xl text-sm font-bold transition-colors ${
                    card.key === 'oro'
                      ? 'bg-yellow-400 hover:bg-yellow-500 text-yellow-900'
                      : 'bg-[#1B4F8C] hover:bg-[#163e6e] text-white'
                  } disabled:opacity-40`}
                >
                  {card.cta}
                </button>
              )}
              {isCurrent && card.key !== 'bronce' && (
                <p className="text-center text-xs text-gray-400 pt-2">Plan activo</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Payment modal */}
      {selecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-7 relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setSelecting(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {done ? (
              <div className="flex flex-col items-center text-center gap-4 py-4">
                <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">Pago enviado</h3>
                  <p className="text-sm text-gray-500 mt-1">Tu pago esta en revision. Cuando sea aprobado tu plan se activara automaticamente.</p>
                </div>
                <button onClick={() => setSelecting(null)} className="w-full py-3 rounded-xl bg-[#1B4F8C] text-white text-sm font-bold">Entendido</button>
              </div>
            ) : (
              <>
                <h3 className="text-base font-black text-gray-900 mb-0.5">
                  Suscribirse a Plan {selecting === 'plata' ? 'Plata' : 'Oro'}
                </h3>
                <p className="text-sm text-gray-500 mb-4">Pago mensual, renovacion manual</p>

                {/* Price box */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4 flex justify-between items-start flex-wrap gap-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-0.5">Monto a pagar</p>
                    <p className="text-2xl font-black text-gray-900">
                      ${planData?.price} <span className="text-sm font-normal text-gray-400">USD</span>
                    </p>
                    {method === 'pago_movil' && bcvRate && planData && (
                      <p className="text-lg font-bold text-gray-700 mt-1">
                        ≈ {(parseFloat(planData.price) * bcvRate).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, '.')}{' '}
                        <span className="text-sm font-normal text-gray-400">Bs.</span>
                      </p>
                    )}
                  </div>
                  {bcvRate && bcvDate && method === 'pago_movil' && (
                    <div className="bg-blue-100 text-blue-700 rounded-lg px-2.5 py-1.5 text-right shrink-0">
                      <p className="text-[10px] font-bold uppercase tracking-wide leading-none">Tasa BCV</p>
                      <p className="text-sm font-black leading-snug">{bcvRate.toFixed(2)} Bs/$</p>
                      <p className="text-[10px] text-blue-500 leading-none">{formatBcvDate(bcvDate)}</p>
                    </div>
                  )}
                </div>

                {/* Method tabs */}
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Metodo de pago</p>
                <div className="flex gap-2 mb-4">
                  {(['pago_movil', 'binance_usdt'] as PaymentMethod[]).map(m => {
                    if (!paymentAccounts.some(a => a.method === m)) return null
                    return (
                      <button key={m} onClick={() => { setMethod(m); setSelectedAccountId(paymentAccounts.find(a => a.method === m)?.id ?? '') }}
                        className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                          method === m ? 'border-[#1B4F8C] bg-blue-50 text-[#1B4F8C]' : 'border-gray-200 text-gray-500'
                        }`}>
                        {m === 'pago_movil' ? 'Pago Movil' : 'Binance USDT'}
                      </button>
                    )
                  })}
                </div>

                {/* Account details */}
                {selectedAccount && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-4 text-xs text-gray-700 space-y-1">
                    <p className="font-semibold text-gray-800 mb-1">{selectedAccount.label}</p>
                    {Object.entries(selectedAccount.details).map(([k, v]) => (
                      <p key={k}><span className="font-semibold capitalize">{k}:</span> {v}</p>
                    ))}
                    <p className="text-gray-400 pt-1">Envia exactamente ${planData?.price} USD e ingresa el numero de referencia.</p>
                  </div>
                )}

                {/* Fecha del pago */}
                <div className="mb-3">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Fecha del pago *</p>
                  <input
                    type="date"
                    value={paymentDate}
                    max={todayStr()}
                    onChange={e => setPaymentDate(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 focus:outline-none focus:border-[#1B4F8C]"
                  />
                </div>


                <input
                  type="text"
                  placeholder="Numero de referencia / TxID"
                  value={reference}
                  onChange={e => setReference(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#1B4F8C] mb-4"
                />
                <button
                  disabled={!reference.trim() || !paymentDate || submitting}
                  onClick={submit}
                  className="w-full py-3 rounded-xl bg-[#1B4F8C] text-white text-sm font-bold disabled:opacity-40 hover:bg-[#163e6e] transition-colors"
                >
                  {submitting ? 'Enviando...' : 'Confirmar pago'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
