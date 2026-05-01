'use client'

import { useState } from 'react'

type Setting = { key: string; value: string; label: string }

export default function AdminSettingsClient({ settings: initial }: { settings: Setting[] }) {
  const [settings, setSettings] = useState(initial)
  const [editing, setEditing] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState<string | null>(null)

  function startEdit(s: Setting) {
    setEditing(s.key)
    setDraft(s.value)
  }

  async function save(key: string) {
    if (!draft.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value: draft.trim() }),
      })
      if (res.ok) {
        setSettings(prev => prev.map(s => s.key === key ? { ...s, value: draft.trim() } : s))
        setEditing(null)
        setSaved(key)
        setTimeout(() => setSaved(null), 2000)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-3 max-w-lg">
      {settings.map(s => (
        <div key={s.key} className="bg-white rounded-2xl shadow-sm p-5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{s.label}</p>
          {editing === s.key ? (
            <div className="flex gap-2 mt-2">
              <input
                type="text"
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') save(s.key); if (e.key === 'Escape') setEditing(null) }}
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-900 focus:outline-none focus:border-[#1B4F8C]"
                autoFocus
              />
              <button
                onClick={() => save(s.key)}
                disabled={saving || !draft.trim()}
                className="px-4 py-2 rounded-xl bg-[#1B4F8C] text-white text-xs font-semibold hover:bg-[#163e6e] transition-colors disabled:opacity-40"
              >
                {saving ? '...' : 'Guardar'}
              </button>
              <button
                onClick={() => setEditing(null)}
                className="px-3 py-2 rounded-xl border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between mt-1">
              <p className="text-2xl font-black text-gray-900">
                {s.key.includes('price') ? `$${s.value} USD` : s.value}
              </p>
              <div className="flex items-center gap-2">
                {saved === s.key && (
                  <span className="text-xs text-green-600 font-semibold">Guardado</span>
                )}
                <button
                  onClick={() => startEdit(s)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 text-xs font-semibold hover:bg-gray-50 transition-colors"
                >
                  Editar
                </button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
