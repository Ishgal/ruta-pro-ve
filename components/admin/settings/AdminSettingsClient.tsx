'use client'

import { useState, useRef, forwardRef, useImperativeHandle } from 'react'

type Setting = { key: string; value: string; label: string }
type ValueHandle = { startEdit: () => void }

function fmt(key: string, value: string) {
  if (key.includes('price')) return { main: `$${parseFloat(value).toFixed(2)}`, unit: 'USD' }
  if (key.includes('pct')) return { main: value, unit: '%' }
  return { main: value, unit: key.includes('coupon') || key.includes('coupons') ? 'por mes' : '' }
}

const Value = forwardRef<ValueHandle, {
  s: Setting
  onSave: (key: string, value: string) => Promise<void>
  size?: 'lg' | 'md'
}>(function Value({ s, onSave, size = 'lg' }, ref) {
  const [mode, setMode] = useState<'view' | 'edit'>('view')
  const [draft, setDraft] = useState(s.value)
  const [saving, setSaving] = useState(false)
  const [flash, setFlash] = useState(false)
  const { main, unit } = fmt(s.key, s.value)

  useImperativeHandle(ref, () => ({
    startEdit() {
      const val = s.key.includes('price')
        ? parseFloat(s.value).toFixed(2)
        : s.value
      setDraft(val)
      setMode('edit')
    },
  }))

  async function commit() {
    if (!draft.trim()) { cancel(); return }
    if (draft.trim() === s.value) { setMode('view'); return }
    setSaving(true)
    await onSave(s.key, draft.trim())
    setSaving(false)
    setMode('view')
    setFlash(true)
    setTimeout(() => setFlash(false), 1800)
  }

  function cancel() {
    setDraft(s.value)
    setMode('view')
  }

  if (mode === 'edit') {
    return (
      <div className="flex items-center gap-2 mt-2">
        <input
          autoFocus
          type="text"
          inputMode="decimal"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onKeyDown={e => {
            if (e.key === 'Enter') commit()
            if (e.key === 'Escape') cancel()
          }}
          className="w-20 bg-transparent border-0 border-b-2 border-[#00B5B5] focus:outline-none text-[#0D2040] pb-0.5 tabular-nums font-black"
          style={{ fontSize: size === 'lg' ? '1.875rem' : '1.5rem', lineHeight: 1 }}
        />
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400">{unit}</span>
        <button
          onClick={commit}
          disabled={saving}
          className="px-2.5 py-1 text-xs font-bold text-white bg-[#00B5B5] hover:bg-[#009999] rounded-lg transition-colors disabled:opacity-50"
        >
          {saving ? '…' : '✓'}
        </button>
        <button
          onClick={cancel}
          className="px-2 py-1 text-xs text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
        >
          ✕
        </button>
      </div>
    )
  }

  return (
    <div
      className="flex items-baseline gap-1.5 mt-2 transition-colors"
      style={{ color: flash ? '#00B5B5' : '#0D2040' }}
    >
      <span
        className="font-black tracking-tight tabular-nums leading-none"
        style={{ fontSize: size === 'lg' ? '2rem' : '1.625rem' }}
      >
        {main}
      </span>
      {unit && (
        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 pb-0.5">
          {unit}
        </span>
      )}
    </div>
  )
})

function EditBtn({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-300 hover:text-[#00B5B5] hover:bg-teal-50 transition-colors shrink-0"
      title="Editar"
    >
      <svg className="w-[18px] h-[18px]" fill="none" stroke="currentColor" strokeWidth={2.2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
      </svg>
    </button>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-3">
      {children}
    </p>
  )
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 leading-none">
      {children}
    </p>
  )
}

export default function AdminSettingsClient({ settings: initial }: { settings: Setting[] }) {
  const [settings, setSettings] = useState(initial)
  const by = Object.fromEntries(settings.map(s => [s.key, s]))
  const refs = useRef<Record<string, ValueHandle | null>>({})

  function startEdit(key: string) {
    refs.current[key]?.startEdit()
  }

  async function onSave(key: string, value: string) {
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, value }),
    })
    if (res.ok) {
      setSettings(prev => prev.map(s => s.key === key ? { ...s, value } : s))
    }
  }

  return (
    <div className="p-8 space-y-8">

      {/* ── Precios de servicios ───────────────────────────────── */}
      <section>
        <SectionLabel>Precios de servicios</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          {(['certificate_price', 'course_extra_price'] as const)
            .filter(k => by[k])
            .map(k => (
              <div key={k} className="bg-white rounded-2xl px-6 py-5 shadow-sm flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <FieldLabel>{by[k].label}</FieldLabel>
                  <Value
                    ref={el => { refs.current[k] = el }}
                    s={by[k]}
                    onSave={onSave}
                    size="lg"
                  />
                </div>
                <EditBtn onClick={() => startEdit(k)} />
              </div>
            ))}
        </div>
      </section>

      {/* ── Planes de suscripción ─────────────────────────────── */}
      <section>
        <SectionLabel>Planes de suscripción</SectionLabel>
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="grid grid-cols-2 divide-x divide-gray-100">

            {/* Headers */}
            <div className="px-6 py-3 bg-slate-50 flex items-center gap-2 border-b border-slate-100">
              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">
                Plan Plata
              </span>
            </div>
            <div className="px-6 py-3 bg-amber-50 flex items-center gap-2 border-b border-amber-100">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
              <span className="text-[10px] font-black uppercase tracking-[0.18em] text-amber-700">
                Plan Oro
              </span>
            </div>

            {/* Precio mensual */}
            <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <FieldLabel>Precio mensual</FieldLabel>
                {by['plan_price_plata'] && (
                  <Value
                    ref={el => { refs.current['plan_price_plata'] = el }}
                    s={by['plan_price_plata']}
                    onSave={onSave}
                    size="md"
                  />
                )}
              </div>
              {by['plan_price_plata'] && <EditBtn onClick={() => startEdit('plan_price_plata')} />}
            </div>
            <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <FieldLabel>Precio mensual</FieldLabel>
                {by['plan_price_oro'] && (
                  <Value
                    ref={el => { refs.current['plan_price_oro'] = el }}
                    s={by['plan_price_oro']}
                    onSave={onSave}
                    size="md"
                  />
                )}
              </div>
              {by['plan_price_oro'] && <EditBtn onClick={() => startEdit('plan_price_oro')} />}
            </div>

            {/* Cupones */}
            <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <FieldLabel>Cupones por mes</FieldLabel>
                {by['plan_coupons_plata'] && (
                  <Value
                    ref={el => { refs.current['plan_coupons_plata'] = el }}
                    s={by['plan_coupons_plata']}
                    onSave={onSave}
                    size="md"
                  />
                )}
              </div>
              {by['plan_coupons_plata'] && <EditBtn onClick={() => startEdit('plan_coupons_plata')} />}
            </div>
            <div className="px-6 py-5 border-b border-gray-50 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <FieldLabel>Cupones por mes</FieldLabel>
                {by['plan_coupons_oro'] && (
                  <Value
                    ref={el => { refs.current['plan_coupons_oro'] = el }}
                    s={by['plan_coupons_oro']}
                    onSave={onSave}
                    size="md"
                  />
                )}
              </div>
              {by['plan_coupons_oro'] && <EditBtn onClick={() => startEdit('plan_coupons_oro')} />}
            </div>

            {/* Descuento */}
            <div className="px-6 py-5 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <FieldLabel>Descuento con cupón</FieldLabel>
                {by['plan_discount_pct_plata'] && (
                  <Value
                    ref={el => { refs.current['plan_discount_pct_plata'] = el }}
                    s={by['plan_discount_pct_plata']}
                    onSave={onSave}
                    size="md"
                  />
                )}
              </div>
              {by['plan_discount_pct_plata'] && <EditBtn onClick={() => startEdit('plan_discount_pct_plata')} />}
            </div>
            <div className="px-6 py-5 flex items-center gap-2">
              <div className="flex-1 min-w-0">
                <FieldLabel>Descuento con cupón</FieldLabel>
                {by['plan_discount_pct_oro'] && (
                  <Value
                    ref={el => { refs.current['plan_discount_pct_oro'] = el }}
                    s={by['plan_discount_pct_oro']}
                    onSave={onSave}
                    size="md"
                  />
                )}
              </div>
              {by['plan_discount_pct_oro'] && <EditBtn onClick={() => startEdit('plan_discount_pct_oro')} />}
            </div>

          </div>
        </div>
      </section>

      <p className="text-[11px] text-gray-300 tracking-wide">
        Haz clic en el lapiz o en el valor para editarlo · Enter para confirmar · Esc para cancelar
      </p>
    </div>
  )
}
