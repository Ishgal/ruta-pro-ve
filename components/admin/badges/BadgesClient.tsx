'use client'

import { useState } from 'react'

type Badge = {
  id: string
  name: string
  description: string | null
  conditionType: string | null
  conditionValue: number | null
  iconUrl: string | null
  _count: { userBadges: number }
}

type FormState = {
  name: string
  description: string
  conditionType: string
  conditionValue: string
  iconUrl: string
}

const GROUPS: { type: string; label: string; hint: string; color: string }[] = [
  { type: 'COURSE_COMPLETION', label: 'Cursos completados', hint: 'Se otorga al completar N cursos en total',           color: 'text-blue-600 bg-blue-50' },
  { type: 'STREAK_DAYS',       label: 'Racha de dias',      hint: 'Se otorga al mantener una racha activa de N dias',   color: 'text-orange-600 bg-orange-50' },
  { type: 'LEVEL_COMPLETION',  label: 'Niveles',            hint: 'Se otorga al completar el nivel N de la ruta',       color: 'text-purple-600 bg-purple-50' },
  { type: 'XP_TOTAL',          label: 'XP acumulado',       hint: 'Se otorga al acumular N puntos de experiencia',      color: 'text-teal-600 bg-teal-50' },
  { type: 'LESSON_COMPLETION', label: 'Lecciones',          hint: 'Se otorga al completar N lecciones en total',        color: 'text-green-600 bg-green-50' },
]

const GROUP_MAP = Object.fromEntries(GROUPS.map(g => [g.type, g]))

const emptyForm: FormState = {
  name: '', description: '', conditionType: 'COURSE_COMPLETION', conditionValue: '', iconUrl: '',
}

function badgeIcon(b: Badge): string {
  if (!b.iconUrl) return '🏅'
  if (b.iconUrl.startsWith('/')) return '🏅'
  return b.iconUrl
}

export default function BadgesClient({ badges: initial }: { badges: Badge[] }) {
  const [badges, setBadges] = useState(initial)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [saving, setSaving] = useState(false)

  const set = (field: keyof FormState, value: string) =>
    setForm(prev => ({ ...prev, [field]: value }))

  function openNew() { setEditingId(null); setForm(emptyForm); setShowForm(true) }

  function openEdit(b: Badge) {
    setEditingId(b.id)
    setForm({
      name: b.name,
      description: b.description ?? '',
      conditionType: b.conditionType ?? 'COURSE_COMPLETION',
      conditionValue: b.conditionValue != null ? String(b.conditionValue) : '',
      iconUrl: b.iconUrl ?? '',
    })
    setShowForm(true)
  }

  function cancelForm() { setShowForm(false); setEditingId(null); setForm(emptyForm) }

  async function save() {
    if (!form.name.trim()) return
    setSaving(true)
    try {
      const body = {
        name: form.name, description: form.description,
        conditionType: form.conditionType,
        conditionValue: form.conditionValue !== '' ? Number(form.conditionValue) : null,
        iconUrl: form.iconUrl,
      }
      if (editingId) {
        const res = await fetch(`/api/admin/badges/${editingId}`, {
          method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        if (res.ok) { const { badge } = await res.json(); setBadges(prev => prev.map(b => b.id === editingId ? badge : b)); cancelForm() }
      } else {
        const res = await fetch('/api/admin/badges', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
        })
        if (res.ok) { const { badge } = await res.json(); setBadges(prev => [...prev, badge]); cancelForm() }
      }
    } finally { setSaving(false) }
  }

  function remove(id: string) {
    if (!confirm('¿Eliminar este logro?')) return
    setBadges(prev => prev.filter(b => b.id !== id))
    fetch(`/api/admin/badges/${id}`, { method: 'DELETE' })
  }

  const totalAwarded = badges.reduce((sum, b) => sum + b._count.userBadges, 0)
  const activeGroups = GROUPS.filter(g => badges.some(b => b.conditionType === g.type))
  const ungrouped = badges.filter(b => !GROUPS.some(g => g.type === b.conditionType))
  const conditionHint = GROUP_MAP[form.conditionType]?.hint ?? ''

  return (
    <div className="p-8 space-y-6" style={{ maxWidth: 'none' }}>

      {/* ── Stats + accion ────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl px-6 py-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-1">Total logros</p>
          <p className="text-3xl font-black text-[#0D2040] tabular-nums">{badges.length}</p>
        </div>
        <div className="bg-white rounded-2xl px-6 py-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-1">Otorgamientos</p>
          <p className="text-3xl font-black text-[#0D2040] tabular-nums">{totalAwarded}</p>
        </div>
        <div className="bg-white rounded-2xl px-6 py-4 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-1">Tipos activos</p>
          <p className="text-3xl font-black text-[#0D2040] tabular-nums">{activeGroups.length}</p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center justify-center gap-2 px-5 py-4 bg-[#1B4F8C] text-white text-sm font-semibold rounded-2xl hover:bg-[#163e6e] transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo logro
        </button>
      </div>

      {/* ── Formulario ────────────────────────────────────── */}
      {showForm && (
        <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col gap-4">
          <p className="font-bold text-gray-900 text-sm">
            {editingId ? 'Editar logro' : 'Nuevo logro'}
          </p>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Nombre</label>
              <input value={form.name} onChange={e => set('name', e.target.value)}
                placeholder="Ej: Explorador"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F8C]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Icono (emoji)</label>
              <input value={form.iconUrl} onChange={e => set('iconUrl', e.target.value)}
                placeholder="🏆"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F8C]" />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Tipo de condicion</label>
              <select value={form.conditionType} onChange={e => set('conditionType', e.target.value)}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F8C]">
                {GROUPS.map(g => <option key={g.type} value={g.type}>{g.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 mb-1 block">Valor (N)</label>
              <input type="number" min="1" value={form.conditionValue}
                onChange={e => set('conditionValue', e.target.value)}
                placeholder="Ej: 1, 5, 10..."
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F8C]" />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 mb-1 block">Descripcion</label>
            <input value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Ej: Completa tu primer curso"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#1B4F8C]" />
            {conditionHint && <p className="text-[11px] text-gray-400 mt-1">{conditionHint}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={save} disabled={saving || !form.name.trim()}
              className="flex-1 py-2.5 rounded-xl bg-[#1B4F8C] text-white text-sm font-semibold hover:bg-[#163e6e] transition-colors disabled:opacity-40">
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear logro'}
            </button>
            <button onClick={cancelForm}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 text-sm font-semibold hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* ── Grupos ────────────────────────────────────────── */}
      {badges.length === 0 && !showForm && (
        <div className="bg-white rounded-2xl p-10 text-center shadow-sm text-gray-400 text-sm">
          Sin logros configurados.
        </div>
      )}

      {[...GROUPS, { type: '__other__', label: 'Otros', hint: '', color: 'text-gray-600 bg-gray-50' }].map(group => {
        const groupBadges = group.type === '__other__'
          ? ungrouped
          : badges.filter(b => b.conditionType === group.type)
        if (groupBadges.length === 0) return null
        const sorted = [...groupBadges].sort((a, b) => (a.conditionValue ?? 0) - (b.conditionValue ?? 0))

        return (
          <section key={group.type}>
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400 mb-2">
              {group.label}
            </p>
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              {sorted.map((b, i) => (
                <div
                  key={b.id}
                  className={`flex items-center gap-5 px-6 py-4 ${i < sorted.length - 1 ? 'border-b border-gray-50' : ''}`}
                >
                  {/* Icono */}
                  <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl shrink-0">
                    {badgeIcon(b)}
                  </div>

                  {/* Nombre + descripcion */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{b.name}</p>
                    {b.description && (
                      <p className="text-xs text-gray-400 mt-0.5">{b.description}</p>
                    )}
                  </div>

                  {/* Valor N */}
                  <div className="text-center w-24 shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Condicion</p>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${GROUP_MAP[b.conditionType ?? '']?.color ?? 'text-gray-600 bg-gray-50'}`}>
                      {b.conditionValue != null ? `N = ${b.conditionValue}` : '—'}
                    </span>
                  </div>

                  {/* Usuarios */}
                  <div className="text-center w-24 shrink-0">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-0.5">Usuarios</p>
                    <p className="text-sm font-bold text-gray-700">{b._count.userBadges}</p>
                  </div>

                  {/* Acciones */}
                  <div className="flex gap-1 shrink-0">
                    <button onClick={() => openEdit(b)} title="Editar"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                      </svg>
                    </button>
                    <button onClick={() => remove(b.id)} title="Eliminar"
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      })}

      <p className="text-[11px] text-gray-300 tracking-wide">
        Los logros se otorgan automaticamente cuando el estudiante cumple la condicion · Haz clic en el lapiz para editar
      </p>
    </div>
  )
}
