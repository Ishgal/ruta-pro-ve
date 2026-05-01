'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface Lesson {
  id: string
  title: string
  displayOrder: number
  duration: string | null
  lessonType: string
  isFreePreview: boolean
  quizData: { questions?: unknown[] } | null
}

const TYPE_LABEL: Record<string, string> = {
  video: 'Video',
  article: 'Articulo',
  slides: 'Diapositivas',
  quiz: 'Evaluacion',
}

const TYPE_COLOR: Record<string, string> = {
  video: 'bg-blue-50 text-blue-600',
  article: 'bg-purple-50 text-purple-600',
  slides: 'bg-amber-50 text-amber-600',
  quiz: 'bg-[#E6F8F8] text-[#007B7D]',
}

export default function LessonsPage() {
  const params = useParams()
  const courseId = params.id as string

  const [lessons, setLessons] = useState<Lesson[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchLessons = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/lessons`)
      if (!res.ok) throw new Error()
      setLessons(await res.json())
    } catch {
      setError('No se pudieron cargar las lecciones.')
    } finally {
      setLoading(false)
    }
  }, [courseId])

  useEffect(() => { fetchLessons() }, [fetchLessons])

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta leccion?')) return
    setDeletingId(id)
    const res = await fetch(`/api/admin/lessons/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (res.ok) {
      setLessons(prev => prev.filter(l => l.id !== id))
    } else {
      setError('No se pudo eliminar la leccion.')
      setTimeout(() => setError(null), 4000)
    }
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href="/admin/courses"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver a cursos
          </Link>
          <h1 className="text-xl font-bold text-gray-900">Lecciones del curso</h1>
          <p className="text-sm text-gray-500 mt-0.5">{lessons.length} leccion{lessons.length !== 1 ? 'es' : ''}</p>
        </div>
        <Link
          href={`/admin/courses/${courseId}/lessons/new`}
          className="flex items-center gap-2 bg-[#00B5B5] hover:bg-[#009999] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nueva leccion
        </Link>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center py-16">
          <p className="text-sm text-gray-400">Cargando lecciones...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {lessons.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347c-.75.412-1.667-.13-1.667-.986V5.653z" />
              </svg>
              <p className="text-sm font-medium">Sin lecciones aun</p>
              <p className="text-xs mt-1">Crea la primera con el boton de arriba.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide w-12">#</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Titulo</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Tipo</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Duracion</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Quiz</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {lessons.map(lesson => {
                  const quizCount = lesson.quizData?.questions?.length ?? 0
                  return (
                    <tr key={lesson.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-4 text-gray-400 font-medium">{lesson.displayOrder}</td>
                      <td className="px-5 py-4 font-medium text-gray-900">
                        {lesson.title}
                        {lesson.isFreePreview && (
                          <span className="ml-2 text-[10px] font-bold bg-green-50 text-green-600 px-1.5 py-0.5 rounded-full">GRATIS</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_COLOR[lesson.lessonType] ?? 'bg-gray-100 text-gray-500'}`}>
                          {TYPE_LABEL[lesson.lessonType] ?? lesson.lessonType}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-gray-500">{lesson.duration ?? '—'}</td>
                      <td className="px-5 py-4">
                        {quizCount > 0 ? (
                          <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                            {quizCount} {quizCount === 1 ? 'pregunta' : 'preguntas'}
                          </span>
                        ) : (
                          <span className="text-gray-300 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center justify-end gap-1">
                          <Link
                            href={`/admin/courses/${courseId}/lessons/${lesson.id}/edit`}
                            title="Editar leccion"
                            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                            </svg>
                          </Link>
                          <button
                            onClick={() => handleDelete(lesson.id)}
                            disabled={deletingId === lesson.id}
                            title="Eliminar leccion"
                            className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  )
}
