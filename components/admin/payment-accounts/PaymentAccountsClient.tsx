'use client'

import { useState } from 'react'

type Account = {
  id: string
  method: string
  label: string
  isActive: boolean
  displayOrder: number
  details: Record<string, string>
}

type FormState = {
  method: 'pago_movil' | 'binance_usdt'
  label: string
  phone: string
  bank: string
  ci: string
  email: string
}

const emptyForm: FormState = {
  method: 'pago_movil', label: '', phone: '', bank: '', ci: '', email: '',
}

// 04126948002 → 0412-6948002
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 4) return digits
  return digits.slice(0, 4) + '-' + digits.slice(4)
}

// 29838893 → 29.838.893
function formatCI(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function buildDetails(f: FormState): Record<string, string> {
  if (f.method === 'pago_movil') {
    return Object.fromEntries(
      [['phone', f.phone], ['bank', f.bank], ['ci', f.ci]]
        .filter(([, v]) => v.trim())
    )
  }
  return f.email.trim() ? { email: f.email.trim() } : {}
}

const LABEL_PLACEHOLDER: Record<string, string> = {
  pago_movil: 'Ej: Banco de Venezuela',
  binance_usdt: 'Ej: Cuenta Binance Principal',
}

export default function PaymentAccountsClient({ accounts: initial }: { accounts: Account[] }) {
  const [accounts, setAccounts] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)
  const [toggling, setToggling] = useState<string | null>(null)

  const set = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  function handlePhone(e: React.ChangeEvent<HTMLInputElement>) {
    set('phone', formatPhone(e.target.value))
  }

  function handleCI(e: React.ChangeEvent<HTMLInputElement>) {
    set('ci', formatCI(e.target.value))
  }

  function handleMethod(e: React.ChangeEvent<HTMLSelectElement>) {
    setForm(prev => ({ ...emptyForm, method: e.target.value as FormState['method'], label: prev.label }))
  }

  function openEdit(a: Account) {
    setEditingId(a.id)
    setForm({
      method: a.method as FormState['method'],
      label: a.label,
      phone: a.details.phone ?? '',
      bank: a.details.bank ?? '',
      ci: a.details.ci ?? '',
      email: a.details.email ?? '',
    })
    setShowForm(true)
  }

  function cancelForm() {
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  async function save() {
    if (!form.label.trim()) return
    setSaving(true)
    try {
      if (editingId) {
        const res = await fetch(`/api/admin/payment-accounts/${editingId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ label: form.label.trim(), details: buildDetails(form) }),
        })
        if (res.ok) {
          const { account } = await res.json()
          setAccounts(prev => prev.map(a => a.id === editingId ? account : a))
          cancelForm()
        }
      } else {
        await create()
      }
    } finally {
      setSaving(false)
    }
  }

  async function create() {
    const res = await fetch('/api/admin/payment-accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ method: form.method, label: form.label.trim(), details: buildDetails(form) }),
    })
    if (res.ok) {
      const { account } = await res.json()
      setAccounts(prev => [...prev, account])
      cancelForm()
    }
  }

  async function toggle(id: string, isActive: boolean) {
    setToggling(id)
    try {
      const res = await fetch(`/api/admin/payment-accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isActive: !isActive }),
      })
      if (res.ok) setAccounts(prev => prev.map(a => a.id === id ? { ...a, isActive: !isActive } : a))
    } finally {
      setToggling(null)
    }
  }

  function remove(id: string) {
    if (!confirm('¿Eliminar esta cuenta de pago?')) return
    setAccounts(prev => prev.filter(a => a.id !== id))
    fetch(`/api/admin/payment-accounts/${id}`, { method: 'DELETE' })
  }

  return (
    <div className="max-w-2xl flex flex-col gap-4">
      {accounts.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl p-8 text-center shadow-sm text-gray-400 text-sm">
          Sin cuentas configuradas. Agrega una para que los estudiantes puedan pagar.
        </div>
      )}

      {accounts.map(a => (
        <div key={a.id} className="bg-white rounded-2xl shadow-sm p-4 flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide ${
                a.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
              }`}>
                {a.isActive ? 'Activa' : 'Inactiva'}
              </span>
              <span className="text-[10px] font-bold bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full uppercase tracking-wide">
                {a.method === 'pago_movil' ? 'Pago Movil' : 'Binance USDT'}
              </span>
            </div>
            <p className="font-semibold text-gray-900 text-sm">{a.label}</p>
            <div className="text-xs text-gray-400 mt-1 space-y-0.5">
              {Object.entries(a.details).map(([k, v]) => (
                <p key={k}><span className="font-medium capitalize">{k}:</span> {v}</p>
              ))}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => openEdit(a)}
              title="Editar"
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
              </svg>
            </button>
            <button
              disabled={toggling === a.id}
              onClick={() => toggle(a.id, a.isActive)}
              title={a.isActive ? 'Desactivar' : 'Activar'}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors disabled:opacity-40 ${
                a.isActive ? 'bg-amber-50 hover:bg-amber-100 text-amber-500' : 'bg-green-50 hover:bg-green-100 text-green-600'
              }`}
            >
              {a.isActive ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </button>
            <button
              onClick={() => remove(a.id)}
              title="Eliminar"
              className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-50 hover:bg-red-100 text-red-400 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}

      {showForm ? (
        <div className="bg-white rounded-2xl shadow-sm p-5 flex flex-col gap-3">
          <p className="font-bold text-gray-900 text-sm mb-1">
            {editingId ? 'Editar cuenta de pago' : 'Nueva cuenta de pago'}
          </p>

          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Metodo</label>
              <select value={form.method} onChange={handleMethod} disabled={!!editingId}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1B4F8C] disabled:bg-gray-50 disabled:text-gray-400">
                <option value="pago_movil">Pago Movil</option>
                <option value="binance_usdt">Binance USDT</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Etiqueta (visible al estudiante)</label>
              <input
                value={form.label}
                onChange={e => set('label', e.target.value)}
                placeholder={LABEL_PLACEHOLDER[form.method]}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1B4F8C]"
              />
            </div>
          </div>

          {form.method === 'pago_movil' ? (
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Telefono</label>
                <input
                  value={form.phone}
                  onChange={handlePhone}
                  placeholder="0412-6948002"
                  inputMode="numeric"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1B4F8C]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">Banco</label>
                <input
                  value={form.bank}
                  onChange={e => set('bank', e.target.value)}
                  placeholder="Ej: Bancamiga (0172)"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1B4F8C]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 mb-1 block">CI</label>
                <input
                  value={form.ci}
                  onChange={handleCI}
                  placeholder="29.838.893"
                  inputMode="numeric"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1B4F8C]"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Email Binance</label>
              <input
                value={form.email}
                onChange={e => set('email', e.target.value)}
                placeholder="correo@ejemplo.com"
                type="email"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1B4F8C]"
              />
            </div>
          )}

          <div className="flex gap-2 mt-1">
            <button onClick={save} disabled={saving || !form.label.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[#1B4F8C] text-white text-sm font-semibold hover:bg-[#163e6e] transition-colors disabled:opacity-40">
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear cuenta'}
            </button>
            <button onClick={cancelForm}
              className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowForm(true)}
          className="flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-sm font-semibold hover:border-[#1B4F8C] hover:text-[#1B4F8C] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Agregar cuenta
        </button>
      )}
    </div>
  )
}
