'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

interface Lesson { id: string }

interface Course {
  id: string
  title: string
  level: { name: string }
  isPublished: boolean
  careers: string[]
  lessons: Lesson[]
}

const CAREER_LABEL: Record<string, string> = {
  contaduria: 'Contaduría',
  sistemas: 'Sistemas',
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses')
      if (!res.ok) throw new Error()
      setCourses(await res.json())
    } catch {
      setError('No se pudieron cargar los cursos.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este curso? Se borrarán también sus lecciones.')) return
    setDeletingId(id)
    const res = await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' })
    setDeletingId(null)
    if (res.ok) {
      setCourses((prev) => prev.filter((c) => c.id !== id))
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'No se pudo eliminar el curso.')
      setTimeout(() => setError(null), 5000)
    }
  }

  useEffect(() => { fetchCourses() }, [])

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Cursos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {courses.length} curso{courses.length !== 1 ? 's' : ''} registrado{courses.length !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="flex items-center gap-2 bg-[#00B5B5] hover:bg-[#009999] text-white text-sm font-semibold px-4 py-2.5 rounded-xl transition-all"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Nuevo curso
        </Link>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">
          {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 flex items-center justify-center py-16">
          <p className="text-sm text-gray-400">Cargando cursos...</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {courses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400">
              <svg className="w-10 h-10 mb-3 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
              </svg>
              <p className="text-sm font-medium">Sin cursos aún</p>
              <p className="text-xs mt-1">Crea el primer curso con el botón de arriba.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Título</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Carrera</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Nivel</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Lecciones</th>
                  <th className="text-left px-5 py-3.5 font-semibold text-gray-500 text-xs uppercase tracking-wide">Estado</th>
                  <th className="px-5 py-3.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {courses.map((course) => (
                  <tr key={course.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4 font-medium text-gray-900">{course.title}</td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(course.careers ?? []).length === 0 ? (
                          <span className="text-gray-400 text-xs">—</span>
                        ) : (course.careers ?? []).map((c) => (
                          <span key={c} className="inline-flex items-center px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium">
                            {CAREER_LABEL[c] ?? c}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4 text-gray-500">{course.level.name}</td>
                    <td className="px-5 py-4 text-gray-500">{course.lessons.length}</td>
                    <td className="px-5 py-4">
                      {course.isPublished ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-600 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400" />
                          Publicado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 text-xs font-medium">
                          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                          Borrador
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/admin/courses/${course.id}/lessons`}
                          title="Gestionar lecciones"
                          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12m-12 5.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                          </svg>
                        </Link>
                        <Link
                          href={`/admin/courses/${course.id}/edit`}
                          title="Editar curso"
                          className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                          </svg>
                        </Link>
                        <button
                          onClick={() => handleDelete(course.id)}
                          disabled={deletingId === course.id}
                          title="Eliminar curso"
                          className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500 disabled:opacity-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
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
      )}
    </div>
  )
}
