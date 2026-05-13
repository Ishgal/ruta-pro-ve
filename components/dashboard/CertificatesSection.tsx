'use client'

import { useState, useEffect } from 'react'

type CertPayment = { id: string; status: string | null }

type Cert = {
  id: string
  qrCode: string
  pdfUrl: string | null
  issuedAt: Date | null
  course: { title: string }
  payments: CertPayment[]
}

type PaymentAccountDetails = {
  phone?: string; bank?: string; ci?: string; holder?: string
  network?: string; wallet?: string; email?: string
}

type PaymentAccount = {
  id: string
  method: string
  label: string
  details: PaymentAccountDetails
}

type Coupon = {
  id: string
  discountPct: number
  expiresAt: string
}

type Props = {
  certs: Cert[]
  certPrice: string
  paymentAccounts: PaymentAccount[]
  availableCoupons: Coupon[]
}

type PaymentMethod = 'pago_movil' | 'binance_usdt'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

function certState(cert: Cert): 'locked' | 'pending' | 'unlocked' {
  if (cert.pdfUrl) return 'unlocked'
  if (cert.payments.some(p => p.status === 'pending' || p.status === null)) return 'pending'
  return 'locked'
}

function formatBcvDate(iso: string): string {
  const [year, month, day] = iso.split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

function formatBs(amount: number): string {
  const [int, dec] = amount.toFixed(2).split('.')
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, '.') + ',' + dec
}

const PREVIEW_COUNT = 2

export default function CertificatesSection({ certs, certPrice, paymentAccounts, availableCoupons }: Props) {
  const [selected, setSelected] = useState<Cert | null>(null)
  const [showAllModal, setShowAllModal] = useState(false)
  const [method, setMethod] = useState<PaymentMethod>('pago_movil')
  const [selectedAccountId, setSelectedAccountId] = useState<string>('')
  const [reference, setReference] = useState('')
  const [paymentDate, setPaymentDate] = useState(todayStr())
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [localCerts, setLocalCerts] = useState(certs)
  const [bcvRate, setBcvRate] = useState<number | null>(null)
  const [bcvDate, setBcvDate] = useState<string | null>(null)
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null)
  const [downloadingId, setDownloadingId] = useState<string | null>(null)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  const accountsForMethod = paymentAccounts.filter(a => a.method === method)
  const selectedAccount = accountsForMethod.find(a => a.id === selectedAccountId) ?? accountsForMethod[0]
  const base = parseFloat(certPrice)
  const finalPrice = appliedCoupon ? parseFloat((base * (1 - appliedCoupon.discountPct / 100)).toFixed(2)) : base
  const bsAmount = bcvRate ? (finalPrice * bcvRate) : null

  useEffect(() => {
    fetch('/api/bcv-rate')
      .then(r => r.json())
      .then(d => { setBcvRate(d.rate); setBcvDate(d.updatedAt) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (selected) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [selected])

  async function downloadCert(certId: string, courseTitle: string) {
    setDownloadingId(certId)
    try {
      const res = await fetch(`/api/certificates/${certId}/pdf`)
      if (!res.ok) throw new Error('Error')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificado-${courseTitle.toLowerCase().replace(/\s+/g, '-')}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
    } catch {
      // silencio — el navegador ya muestra error de red si aplica
    } finally {
      setDownloadingId(null)
    }
  }

  function openModal(cert: Cert) {
    const firstMethod = paymentAccounts[0]?.method as PaymentMethod ?? 'pago_movil'
    setSelected(cert)
    setMethod(firstMethod)
    setSelectedAccountId(paymentAccounts.find(a => a.method === firstMethod)?.id ?? '')
    setReference('')
    setPaymentDate(todayStr())
    setDone(false)
    setAppliedCoupon(null)
  }

  function closeModal() {
    setSelected(null)
    setReference('')
    setPaymentDate(todayStr())
    setDone(false)
    setAppliedCoupon(null)
  }

  function switchMethod(m: PaymentMethod) {
    setMethod(m)
    setSelectedAccountId(paymentAccounts.find(a => a.method === m)?.id ?? '')
  }

  async function submitPayment() {
    if (!selected || !reference.trim() || !paymentDate) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/payments/certificates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificateId: selected.id,
          method,
          transactionId: reference.trim(),
          certDiscountId: appliedCoupon?.id ?? undefined,
          paymentDate,
          exchangeRate: method === 'pago_movil' && bcvRate ? bcvRate : undefined,
          amountBs: method === 'pago_movil' && bcvRate ? parseFloat((finalPrice * bcvRate).toFixed(2)) : undefined,
        }),
      })
      if (res.ok) {
        setDone(true)
        setLocalCerts(prev => prev.map(c =>
          c.id === selected.id
            ? { ...c, payments: [{ id: 'new', status: 'pending' }] }
            : c
        ))
      }
    } finally {
      setSubmitting(false)
    }
  }

  const preview = localCerts.slice(0, PREVIEW_COUNT)

  if (localCerts.length === 0) {
    return (
      <div className="flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Certificados</h2>
        </div>
        <div className="flex flex-col items-center justify-center py-8 text-gray-300">
          <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
          <p className="text-sm font-medium text-gray-400">Sin certificados aun</p>
          <p className="text-xs text-gray-300 mt-1">Completa un curso para obtener el tuyo</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Certificados</h2>
          {localCerts.length > PREVIEW_COUNT && (
            <button
              onClick={() => setShowAllModal(true)}
              className="text-sm text-[#00B5B5] font-semibold hover:underline"
            >
              Ver todos
            </button>
          )}
        </div>

        {/* Preview: 2 most recent */}
        <div className="flex flex-col gap-3">
        {preview.map(cert => {
          const state = certState(cert)
          return (
            <div key={cert.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
              <div className={`w-12 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                state === 'unlocked' ? 'bg-[#1B4F8C]' :
                state === 'pending'  ? 'bg-amber-100'  : 'bg-gray-100'
              }`}>
                {state === 'unlocked' && (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {state === 'pending' && (
                  <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
                {state === 'locked' && (
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                  </svg>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">{cert.course.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  {state === 'unlocked' && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Desbloqueado</span>}
                  {state === 'pending'  && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Pago en verificacion</span>}
                  {state === 'locked'   && <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Bloqueado · ${certPrice}</span>}
                  <span className="text-xs text-gray-400">ID: {cert.qrCode.slice(0, 12)}</span>
                </div>
              </div>

              {state === 'unlocked' && (
                <button
                  onClick={() => downloadCert(cert.id, cert.course.title)}
                  disabled={downloadingId === cert.id}
                  aria-label="Descargar certificado"
                  className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-60 flex items-center justify-center transition-colors"
                >
                  {downloadingId === cert.id ? (
                    <svg className="w-4 h-4 text-gray-400 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  )}
                </button>
              )}
              {state === 'locked' && (
                <button onClick={() => openModal(cert)} className="shrink-0 px-3 py-1.5 rounded-lg bg-[#1B4F8C] text-white text-xs font-semibold hover:bg-[#163e6e] transition-colors">
                  Desbloquear
                </button>
              )}
            </div>
          )
        })}
        </div>
      </div>

      {/* Ver todos modal */}
      {showAllModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Todos los certificados</h3>
              <button
                onClick={() => setShowAllModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-3">
              {localCerts.map(cert => {
                const state = certState(cert)
                return (
                  <div key={cert.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                      state === 'unlocked' ? 'bg-[#1B4F8C]' :
                      state === 'pending'  ? 'bg-amber-100'  : 'bg-gray-100'
                    }`}>
                      {state === 'unlocked' && <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      {state === 'pending'  && <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                      {state === 'locked'   && <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{cert.course.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {state === 'unlocked' && <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider">Desbloqueado</span>}
                        {state === 'pending'  && <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wider">En verificacion</span>}
                        {state === 'locked'   && <span className="text-[10px] font-bold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full uppercase tracking-wider">Bloqueado</span>}
                      </div>
                    </div>
                    {state === 'unlocked' && (
                      <button
                        onClick={() => downloadCert(cert.id, cert.course.title)}
                        disabled={downloadingId === cert.id}
                        aria-label="Descargar"
                        className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 disabled:opacity-60 flex items-center justify-center transition-colors shrink-0"
                      >
                        {downloadingId === cert.id ? (
                          <svg className="w-3.5 h-3.5 text-gray-400 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                          </svg>
                        ) : (
                          <svg className="w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        )}
                      </button>
                    )}
                    {state === 'locked' && (
                      <button
                        onClick={() => { setShowAllModal(false); openModal(cert) }}
                        className="shrink-0 px-3 py-1.5 rounded-lg bg-[#1B4F8C] text-white text-xs font-semibold hover:bg-[#163e6e] transition-colors"
                      >
                        Desbloquear
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Payment modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-7 relative max-h-[90vh] overflow-y-auto">
            <button onClick={closeModal} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors">
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
                  <p className="text-sm text-gray-500 mt-1">Tu pago esta en revision. Cuando sea aprobado tu certificado quedara disponible.</p>
                </div>
                <button onClick={closeModal} className="w-full py-3 rounded-xl bg-[#1B4F8C] text-white text-sm font-bold">Entendido</button>
              </div>
            ) : (
              <>
                <h3 className="text-base font-black text-gray-900 mb-0.5">Desbloquear certificado</h3>
                <p className="text-sm text-gray-500 mb-4">{selected.course.title}</p>

                {/* Price box */}
                <div className="bg-gray-50 rounded-xl p-4 mb-4 relative">
                  {bcvRate && bcvDate && (
                    <div className="absolute top-3 right-3 bg-blue-100 text-blue-700 rounded-lg px-2.5 py-1.5 text-right">
                      <p className="text-[10px] font-bold uppercase tracking-wide leading-none">Tasa BCV</p>
                      <p className="text-sm font-black leading-snug">{bcvRate.toFixed(2)} Bs/$</p>
                      <p className="text-[10px] text-blue-500 leading-none">{formatBcvDate(bcvDate)}</p>
                    </div>
                  )}
                  <p className="text-xs text-gray-500 mb-0.5">Monto a pagar</p>
                  {appliedCoupon && (
                    <p className="text-sm text-gray-400 line-through">${base.toFixed(2)} USD</p>
                  )}
                  <p className="text-2xl font-black text-gray-900">
                    ${finalPrice.toFixed(2)}{' '}
                    <span className="text-sm font-normal text-gray-400">USD</span>
                    {appliedCoupon && (
                      <span className="ml-2 text-sm font-bold text-green-600">-{appliedCoupon.discountPct}%</span>
                    )}
                  </p>
                  {method === 'pago_movil' && bsAmount && (
                    <p className="text-lg font-bold text-gray-700 mt-1">
                      ≈ {formatBs(bsAmount)}{' '}
                      <span className="text-sm font-normal text-gray-400">Bs.</span>
                    </p>
                  )}
                </div>

                {/* Coupon section */}
                {availableCoupons.length > 0 && (
                  <div className="mb-4">
                    {!appliedCoupon ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                        <p className="text-xs font-semibold text-green-800 mb-2">
                          Tienes {availableCoupons.length} cupon{availableCoupons.length > 1 ? 'es' : ''} de descuento disponible{availableCoupons.length > 1 ? 's' : ''}
                        </p>
                        <div className="flex flex-col gap-1.5">
                          {availableCoupons.map(c => (
                            <button
                              key={c.id}
                              onClick={() => setAppliedCoupon(c)}
                              className="flex items-center justify-between text-left px-3 py-2 rounded-lg bg-white border border-green-200 hover:border-green-400 transition-colors"
                            >
                              <span className="text-sm font-bold text-green-700">{c.discountPct}% de descuento</span>
                              <span className="text-[10px] text-gray-400">Vence {formatBcvDate(c.expiresAt)}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between bg-green-50 border border-green-300 rounded-xl px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm font-bold text-green-700">Cupon de {appliedCoupon.discountPct}% aplicado</span>
                        </div>
                        <button onClick={() => setAppliedCoupon(null)} className="text-xs text-gray-400 hover:text-gray-600 underline">
                          Quitar
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Method tabs */}
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Metodo de pago</p>
                <div className="flex gap-2 mb-4">
                  {(['pago_movil', 'binance_usdt'] as PaymentMethod[]).map(m => {
                    const hasAccounts = paymentAccounts.some(a => a.method === m)
                    if (!hasAccounts) return null
                    return (
                      <button key={m} onClick={() => switchMethod(m)} className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                        method === m ? 'border-[#1B4F8C] bg-blue-50 text-[#1B4F8C]' : 'border-gray-200 text-gray-500'
                      }`}>
                        {m === 'pago_movil' ? 'Pago Movil' : 'Binance USDT'}
                      </button>
                    )
                  })}
                </div>

                {/* Account selector */}
                {accountsForMethod.length > 1 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Cuenta destino</p>
                    <div className="flex flex-col gap-1.5">
                      {accountsForMethod.map(acc => (
                        <button key={acc.id} onClick={() => setSelectedAccountId(acc.id)} className={`text-left px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                          selectedAccount?.id === acc.id ? 'border-[#1B4F8C] bg-blue-50 text-[#1B4F8C]' : 'border-gray-200 text-gray-600'
                        }`}>
                          {acc.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Account details */}
                {selectedAccount && (
                  <div className="bg-blue-50 rounded-xl p-4 mb-4 text-xs text-gray-700 space-y-1">
                    <p className="font-semibold text-gray-800 mb-1">{selectedAccount.label}</p>
                    {method === 'pago_movil' && (
                      <>
                        {selectedAccount.details.phone  && <p><span className="font-semibold">Telefono:</span> {selectedAccount.details.phone}</p>}
                        {selectedAccount.details.bank   && <p><span className="font-semibold">Banco:</span> {selectedAccount.details.bank}</p>}
                        {selectedAccount.details.ci     && <p><span className="font-semibold">CI:</span> {selectedAccount.details.ci}</p>}
                        {selectedAccount.details.holder && <p><span className="font-semibold">Nombre:</span> {selectedAccount.details.holder}</p>}
                      </>
                    )}
                    {method === 'binance_usdt' && (
                      <>
                        {selectedAccount.details.network && <p><span className="font-semibold">Red:</span> {selectedAccount.details.network}</p>}
                        {selectedAccount.details.wallet  && <p className="break-all"><span className="font-semibold">Wallet:</span> {selectedAccount.details.wallet}</p>}
                        {selectedAccount.details.email   && <p><span className="font-semibold">Email Binance:</span> {selectedAccount.details.email}</p>}
                      </>
                    )}
                    <p className="text-gray-400 pt-1">
                      Envia exactamente ${finalPrice.toFixed(2)} USD e ingresa el numero de referencia abajo.
                    </p>
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
                  onClick={submitPayment}
                  className="w-full py-3 rounded-xl bg-[#1B4F8C] text-white text-sm font-bold disabled:opacity-40 hover:bg-[#163e6e] transition-colors"
                >
                  {submitting ? 'Enviando...' : 'Confirmar pago'}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Toast de descarga exitosa */}
      <div className={`fixed bottom-6 right-6 z-[200] flex items-center gap-3 bg-gray-900 text-white text-sm font-medium px-4 py-3 rounded-xl shadow-xl transition-all duration-300 ${
        downloadSuccess ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'
      }`}>
        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shrink-0">
          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
          </svg>
        </div>
        Certificado descargado
      </div>
    </>
  )
}
