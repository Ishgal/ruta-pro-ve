'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'

export interface TeacherWithRating {
  id: string
  name: string
  email: string
  role: string
  plan: string
  isActive: boolean
  setupStatus: string
  createdAt: Date | null
  rating: number
  courses: { id: string; title: string; isPublished: boolean | null }[]
}

interface Props {
  initialTeachers: TeacherWithRating[]
}

export default function TeachersClient({ initialTeachers = [] }: Props) {
  const [teachers, setTeachers] = useState<TeacherWithRating[]>(initialTeachers || [])
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [formData, setFormData] = useState({ name: '', email: '' })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [generatedLink, setGeneratedLink] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [editingTeacher, setEditingTeacher] = useState<TeacherWithRating | null>(null)
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

    const res = await fetch('/api/admin/teachers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    })
    const data = await res.json()
    setIsSubmitting(false)

    if (!res.ok) { showError(data.error ?? 'Error al crear el docente'); return }

    const updated = await fetch('/api/admin/teachers').then((r) => r.json())
    setTeachers(updated || [])
    setFormData({ name: '', email: '' })
    setIsFormOpen(false)
    setGeneratedLink(data.inviteLink)
  }

  async function handleResend(id: string) {
    setLoadingId(id)
    const res = await fetch(`/api/admin/teachers/${id}/resend`, { method: 'POST' })
    const data = await res.json()
    setLoadingId(null)

    if (!res.ok) { showError(data.error ?? 'Error al generar el link'); return }
    setGeneratedLink(data.inviteLink)
  }

  function openEdit(teacher: TeacherWithRating) {
    setEditingTeacher(teacher)
    setEditName(teacher.name)
  }

  async function handleEdit(e: React.FormEvent) {
    e.preventDefault()
    if (!editingTeacher) return
    setIsSaving(true)

    const res = await fetch(`/api/admin/teachers/${editingTeacher.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: editName }),
    })
    const data = await res.json()
    setIsSaving(false)

    if (!res.ok) { showError(data.error ?? 'Error al guardar'); return }
    setTeachers((prev) => prev.map((t) => t.id === editingTeacher.id ? { ...t, name: data.name } : t))
    setEditingTeacher(null)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar este docente? Esta acción no se puede deshacer.')) return
    setLoadingId(id)
    const res = await fetch(`/api/admin/teachers/${id}`, { method: 'DELETE' })
    setLoadingId(null)
    if (res.ok) setTeachers((prev) => prev.filter((t) => t.id !== id))
    else showError('Error al eliminar el docente.')
  }

  const renderStars = (rating: number) => {
    const stars = []
    const safeRating = rating || 0
    for (let i = 0; i < 5; i++) {
      stars.push(
        <Star
          key={i}
          className={`w-4 h-4 ${i < Math.round(safeRating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
        />
      )
    }
    return <div className="flex items-center gap-0.5">{stars}</div>
  }

  // Validación de seguridad: asegurar que teachers siempre sea un array
  const safeTeachers = Array.isArray(teachers) ? teachers : []

  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Docentes</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {safeTeachers.length} docente{safeTeachers.length !== 1 ? 's' : ''} registrado{safeTeachers.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="flex items-center gap-2 bg-teal-500 hover:bg-teal-600 text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Crear docente
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-x-auto">
        {safeTeachers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            <p className="text-sm font-medium">Sin docentes aún</p>
            <p className="text-xs mt-1">Crea el primer docente con el botón de arriba.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Nombre</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Email</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Calificación</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Cursos</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Estado</th>
                <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Creado</th>
                <th className="px-5 py-3.5" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {safeTeachers.map((teacher) => (
                <tr key={teacher.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4 font-medium text-gray-900">{teacher.name || '—'}</td>
                  <td className="px-5 py-4 text-gray-500">{teacher.email}</td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col items-start gap-0.5">
                      {renderStars(teacher.rating)}
                      <span className="text-xs text-gray-400">{teacher.rating.toFixed(1)} / 5</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {!teacher.courses || teacher.courses.length === 0 ? (
                      <span className="text-xs text-gray-400">—</span>
                    ) : (
                      <div className="flex flex-col gap-1 max-w-xs">
                        {teacher.courses.slice(0, 2).map(course => (
                          <span key={course.id} className="text-xs bg-gray-100 px-2 py-0.5 rounded-full inline-block w-fit">
                            {course.title}
                          </span>
                        ))}
                        {teacher.courses.length > 2 && (
                          <span className="text-xs text-gray-400">+{teacher.courses.length - 2} más</span>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {teacher.setupStatus === 'pending' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-600 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        Pendiente
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-medium">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                        Activo
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-gray-400 text-xs">
                    {teacher.createdAt
                      ? new Date(teacher.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '—'}
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      {teacher.setupStatus === 'pending' && (
                        <button
                          onClick={() => handleResend(teacher.id)}
                          disabled={loadingId === teacher.id}
                          title="Obtener link de acceso"
                          className="p-2 rounded-lg text-teal-500 hover:bg-teal-50 disabled:opacity-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                          </svg>
                        </button>
                      )}
                      <button
                        onClick={() => openEdit(teacher)}
                        title="Editar docente"
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(teacher.id)}
                        disabled={loadingId === teacher.id}
                        title="Eliminar docente"
                        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Crear docente */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">Crear docente</h2>
              <button onClick={() => setIsFormOpen(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleCreate} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isSubmitting} className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold disabled:opacity-60">
                  {isSubmitting ? 'Creando...' : 'Crear'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Editar docente */}
      {editingTeacher && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-bold text-gray-900">Editar docente</h2>
              <button onClick={() => setEditingTeacher(null)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleEdit} className="flex flex-col gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Nombre completo</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Email</label>
                <input type="email" value={editingTeacher.email} disabled className="w-full px-3.5 py-2.5 rounded-xl border border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed" />
              </div>
              <div className="flex gap-3 mt-2">
                <button type="button" onClick={() => setEditingTeacher(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancelar
                </button>
                <button type="submit" disabled={isSaving} className="flex-1 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-semibold disabled:opacity-60">
                  {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Link de invitación */}
      {generatedLink && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">Link de acceso</h2>
                <p className="text-xs text-gray-500">Comparte este link con el docente. Expira en 24 horas.</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2.5 mb-4">
              <p className="text-xs text-gray-600 flex-1 truncate font-mono">{generatedLink}</p>
              <button onClick={() => copyLink(generatedLink)} className="text-xs font-semibold text-teal-500 hover:text-teal-600">
                {copied ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
            <button onClick={() => setGeneratedLink(null)} className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-gray-700 text-white font-semibold">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}