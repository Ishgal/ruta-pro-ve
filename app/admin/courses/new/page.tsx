'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Level {
  id: number
  name: string
}

const CAREERS = [
  { value: 'contaduria', label: 'Contaduría' },
  { value: 'sistemas', label: 'Sistemas' },
]

const input = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00B5B5]/30 focus:border-[#00B5B5] transition-all bg-white'
const label = 'block text-sm font-medium text-gray-700 mb-1.5'

export default function NewCoursePage() {
  const router = useRouter()
  const [levels, setLevels] = useState<Level[]>([])
  const [form, setForm] = useState({
    title: '',
    description: '',
    levelId: 1,
    careers: [] as string[],
    duration: '',
    thumbnailUrl: '',
    skillsTags: [] as string[],
    isPublished: false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/levels').then((r) => r.json()).then(setLevels).catch(console.error)
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      setForm((prev) => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }))
    } else {
      setForm((prev) => ({ ...prev, [name]: value }))
    }
  }

  function handleCareerToggle(career: string) {
    setForm((prev) => ({
      ...prev,
      careers: prev.careers.includes(career)
        ? prev.careers.filter((c) => c !== career)
        : [...prev.careers, career],
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const res = await fetch('/api/admin/courses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        skillsTags: typeof form.skillsTags === 'string'
          ? (form.skillsTags as unknown as string).split(',').map((t: string) => t.trim()).filter(Boolean)
          : form.skillsTags,
      }),
    })
    if (res.ok) {
      router.push('/admin/courses')
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Error al crear el curso.')
      setLoading(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <Link
          href="/admin/courses"
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Volver a cursos
        </Link>
        <h1 className="text-xl font-bold text-gray-900">Nuevo curso</h1>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 p-6 max-w-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div>
            <label className={label}>Título *</label>
            <input
              type="text"
              name="title"
              required
              value={form.title}
              onChange={handleChange}
              placeholder="Ej: Fundamentos de Contabilidad"
              className={input}
            />
          </div>

          <div>
            <label className={label}>Descripción</label>
            <textarea
              name="description"
              rows={4}
              value={form.description}
              onChange={handleChange}
              placeholder="Describe de qué trata el curso..."
              className={input}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={label}>Nivel</label>
              <select name="levelId" value={form.levelId} onChange={handleChange} className={input}>
                {levels.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={label}>Duración</label>
              <input
                type="text"
                name="duration"
                value={form.duration}
                onChange={handleChange}
                placeholder="Ej: 2h 30m"
                className={input}
              />
            </div>
          </div>

          <div>
            <label className={label}>Carreras</label>
            <div className="flex gap-3">
              {CAREERS.map(({ value, label: lbl }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => handleCareerToggle(value)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    form.careers.includes(value)
                      ? 'bg-[#E6F8F8] border-[#00B5B5] text-[#00B5B5]'
                      : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <span className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    form.careers.includes(value) ? 'bg-[#00B5B5] border-[#00B5B5]' : 'border-gray-300'
                  }`}>
                    {form.careers.includes(value) && (
                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                  </span>
                  {lbl}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className={label}>Habilidades (separadas por coma)</label>
            <input
              type="text"
              value={form.skillsTags.join(', ')}
              onChange={(e) => setForm((p) => ({ ...p, skillsTags: e.target.value.split(',').map((t) => t.trim()) }))}
              placeholder="Ej: Excel, Finanzas, Contabilidad básica"
              className={input}
            />
          </div>

          <div>
            <label className={label}>URL de miniatura</label>
            <input
              type="text"
              name="thumbnailUrl"
              value={form.thumbnailUrl}
              onChange={handleChange}
              placeholder="https://..."
              className={input}
            />
          </div>

          <div className="flex gap-5 pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <div
                onClick={() => setForm((p) => ({ ...p, isPublished: !p.isPublished }))}
                className={`w-9 h-5 rounded-full transition-colors ${form.isPublished ? 'bg-[#00B5B5]' : 'bg-gray-200'}`}
              >
                <div className="w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform" style={{ transform: form.isPublished ? 'translateX(18px)' : 'translateX(2px)' }} />
              </div>
              <span className="text-sm text-gray-700">Publicar</span>
            </label>
          </div>

          <div className="flex gap-3 pt-2 border-t border-gray-100">
            <Link
              href="/admin/courses"
              className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all text-center"
            >
              Cancelar
            </Link>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl bg-[#00B5B5] hover:bg-[#009999] text-white text-sm font-semibold transition-all disabled:opacity-60"
            >
              {loading ? 'Creando...' : 'Crear curso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
