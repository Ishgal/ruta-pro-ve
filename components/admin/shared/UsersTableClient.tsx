'use client'

import { useState } from 'react'
import { User } from '@/domain/entities/user.entity'

const PAGE_SIZE = 10

interface Props {
  title: string
  singularLabel: string
  initialUsers: User[]
  apiBase: string
  canInvite?: boolean
  canToggleActive?: boolean
}

export default function UsersTableClient({
  title,
  singularLabel,
  initialUsers,
  apiBase,
  canInvite = false,
  canToggleActive = false,
}: Props) {
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [page, setPage] = useState(0)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [editName, setEditName] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function showError(msg: string) {
    setError(msg)
    setTimeout(() => setError(null), 5000)
  }

  async function copyLink(link: string) {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const res = await fetch(apiBase, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    const data = await res.json()
    setIsSubmitting(false)

    if (!res.ok) { showError(data.error ?? `Error al crear el ${singularLabel}`); return }

    const updated = await fetch(apiBase).then((r) => r.json())
    setUsers(updated)
    setFormData({ name: '', email: '' })
    setIsFormOpen(false)
    setGeneratedLink(data.inviteLink)
  }

  async function handleGetLink(id: string) {
    setLoadingId(id)
    const res = await fetch(`${apiBase}/${id}/resend`, { method: 'POST' })
    const data = await res.json()
    setLoadingId(null)

    if (!res.ok) { showError(data.error ?? 'Error al generar el link'); return }
    setGeneratedLink(data.inviteLink)
  }

  function openEdit(user: User) {
    setEditingUser(user)
    setEditName(user.name)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingUser) return
    setIsSaving(true)

    const res = await fetch(`${apiBase}/${editingUser.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    })
    const data = await res.json()
    setIsSaving(false)

    if (!res.ok) { showError(data.error ?? 'Error al guardar'); return }
    setUsers((prev) => prev.map((u) => u.id === editingUser.id ? { ...u, name: data.name } : u))
    setEditingUser(null)
  }

  async function handleDelete(id: string) {
    if (!confirm(`¿Eliminar este ${singularLabel}? Esta acción no se puede deshacer.`)) return
    setLoadingId(id)
    const res = await fetch(`${apiBase}/${id}`, { method: 'DELETE' })
    setLoadingId(null)
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== id))
    else {
      const data = await res.json().catch(() => ({}))
      showError(data.error ?? `Error al eliminar el ${singularLabel}.`)
    }
  }

  async function handleToggleActive(user: User) {
    const next = !user.isActive
    setLoadingId(user.id)
    const res = await fetch(`${apiBase}/${user.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: next }),
    })
    setLoadingId(null)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      showError(data.error ?? 'Error al cambiar el estado')
      return
    }
    setUsers((prev) => prev.map((u) => u.id === user.id ? { ...u, isActive: next } : u))
  }

  const count = users.length
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE))
  const safePage = Math.min(page, totalPages - 1)
  const paged = users.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE)

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {count} {singularLabel}{count !== 1 ? 's' : ''} registrado{count !== 1 ? 's' : ''}
          </p>
        </div>
        {canInvite && (
          <button
            onClick={() => setIsFormOpen(true)}
            className="flex items-center gap-2 bg-[#00B5B5] hover:bg-[#009999] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Crear {singularLabel}
          </button>
        )}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <p className="text-sm font-medium">Sin {singularLabel}s aún</p>
            {canInvite && <p className="text-xs mt-1">Crea el primer {singularLabel} con el botón de arriba.</p>}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Nombre</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Estado</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Creado</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {paged.map((user) => {
                const isPending = user.setupStatus === 'pending'
                const isInactive = !isPending && user.isActive === false
                const showToggle = canToggleActive && !isPending
                const showDelete = !canToggleActive || isPending

                return (
                  <tr key={user.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900">{user.name}</td>
                    <td className="px-5 py-4 text-gray-500">{user.email}</td>
                    <td className="px-5 py-4">
                      {isPending ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                          Pendiente
                        </span>
                      ) : isInactive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          Inactivo
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          Activo
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-gray-400 text-xs">
                      {user.createdAt
                        ? new Date(user.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
                        : '—'}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        {canInvite && isPending && (
                          <button
                            onClick={() => handleGetLink(user.id)}
                            disabled={loadingId === user.id}
                            title="Obtener link de acceso"
                            className="p-2 rounded-lg text-[#00B5B5] hover:bg-[#E6F8F8] disabled:opacity-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </button>
                        )}
                        {showToggle && (
                          <button
                            onClick={() => handleToggleActive(user)}
                            disabled={loadingId === user.id}
                            title={user.isActive ? 'Marcar como inactivo' : 'Marcar como activo'}
                            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:opacity-50 transition-colors"
                          >
                            {user.isActive ? (
                              /* pause icon */
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
                              </svg>
                            ) : (
                              /* play icon */
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653z" />
                              </svg>
                            )}
                          </button>
                        )}
                        <button
                          onClick={() => openEdit(user)}
                          title={`Editar ${singularLabel}`}
                          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                        </button>
                        {showDelete && (
                          <button
                            onClick={() => handleDelete(user.id)}
                            disabled={loadingId === user.id}
                            title={`Eliminar ${singularLabel}`}
                            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-400">Pag. {safePage + 1} de {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={safePage === 0}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={safePage >= totalPages - 1}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create modal */}
      {canInvite && isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">Crear {singularLabel}</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Ej: Carlos Rodríguez"
                  className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00B5B5]/30 focus:border-[#00B5B5] transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                  placeholder={`${singularLabel}@email.com`}
                  className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00B5B5]/30 focus:border-[#00B5B5] transition-all"
                />
              </div>
              <p className="text-xs text-gray-400 bg-gray-50 px-3 py-2.5 rounded-lg">
                Se generará un link de acceso para compartir con el {singularLabel}.
              </p>
              <div className="flex gap-3 mt-1">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-[#00B5B5] hover:bg-[#009999] text-white text-sm font-semibold transition-all disabled:opacity-60">
                  {isSubmitting ? 'Creando...' : 'Crear y obtener link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">Editar {singularLabel}</h2>
              <button onClick={() => setEditingUser(null)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#00B5B5]/30 focus:border-[#00B5B5] transition-all"
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="text"
                  value={editingUser.email}
                  disabled
                  className="px-3.5 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-sm text-gray-400 cursor-not-allowed"
                />
                <p className="text-xs text-gray-400">El email no puede modificarse.</p>
              </div>
              <div className="flex gap-3 mt-1">
                <button type="button" onClick={() => setEditingUser(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-[#00B5B5] hover:bg-[#009999] text-white text-sm font-semibold transition-all disabled:opacity-60">
                  {isSaving ? 'Guardando...' : 'Guardar cambios'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Link modal */}
      {generatedLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Link de acceso generado</h2>
                <p className="text-xs text-gray-500 mt-0.5">Comparte este link con el {singularLabel}. Expira en 24 horas.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-4">
              <p className="text-xs text-gray-600 flex-1 truncate font-mono">{generatedLink}</p>
              <button onClick={() => copyLink(generatedLink)} className="shrink-0 text-xs font-semibold text-[#00B5B5] hover:text-[#009999] transition-colors">
                {copied ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
            <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2.5 rounded-lg mb-4">
              Este link aparece una sola vez. Si lo necesitas de nuevo, usa el icono de link en la tabla.
            </p>
            <button onClick={() => setGeneratedLink(null)} className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-700 text-white text-sm font-semibold transition-all">
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
