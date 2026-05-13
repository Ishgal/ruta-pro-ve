'use client'

import { useState } from 'react'
import { BookOpen, Clock, X, ChevronRight } from 'lucide-react'

type Course = {
  id: string
  title: string
  description: string
  levelName: string
  lessonCount: number
  duration: string | null
  thumbnailUrl: string | null
  enrollmentStatus: string | null
}

type PaymentAccount = {
  id: string
  method: string
  label: string
  details: Record<string, string>
}

type Props = {
  courses: Course[]
  price: string
  paymentAccounts: PaymentAccount[]
}

type PaymentMethod = 'pago_movil' | 'binance_usdt'

function todayStr() {
  return new Date().toISOString().split('T')[0]
}

export default function ExploreCoursesClient({ courses, price, paymentAccounts }: Props) {
  const [selected, setSelected] = useState<Course | null>(null)
  const [method, setMethod] = useState<PaymentMethod>('pago_movil')
  const [reference, setReference] = useState('')
  const [paymentDate, setPaymentDate] = useState(todayStr())
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [localCourses, setLocalCourses] = useState(courses)

  const accountsForMethod = paymentAccounts.filter(a => a.method === method)
  const selectedAccount = accountsForMethod[0]

  const handleSubmit = async () => {
    if (!selected || !reference.trim()) return
    setSubmitting(true)
    try {
      const res = await fetch('/api/payments/extra-courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId: selected.id,
          method,
          transactionId: reference.trim(),
          paymentDate,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        alert(data.error ?? 'Error al enviar el pago')
        return
      }
      setDone(true)
      setLocalCourses(prev =>
        prev.map(c => c.id === selected.id ? { ...c, enrollmentStatus: 'pending' } : c)
      )
    } catch {
      alert('Error de conexion. Intenta de nuevo.')
    } finally {
      setSubmitting(false)
    }
  }

  const closeModal = () => {
    setSelected(null)
    setDone(false)
    setReference('')
    setPaymentDate(todayStr())
    setMethod('pago_movil')
  }

  const statusBadge = (status: string | null) => {
    if (status === 'active') return <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Acceso activo</span>
    if (status === 'pending') return <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Pago pendiente</span>
    if (status === 'rejected') return <span className="text-xs font-semibold text-red-500 bg-red-50 px-2 py-0.5 rounded-full">Rechazado</span>
    return null
  }

  return (
    <div className="min-h-screen bg-[#F4F6F9] px-4 py-6 md:px-8">
      <div className="max-w-3xl">
        <div className="flex items-center gap-2 mb-1">
          <a href="/dashboard/courses" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">Mis cursos</a>
          <ChevronRight className="w-3 h-3 text-gray-400" />
          <span className="text-sm text-gray-700 font-medium">Explorar</span>
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-0.5">Explorar cursos</h1>
        <p className="text-sm text-gray-500 mb-6">
          Agrega cursos fuera de tu ruta por <span className="font-semibold text-gray-700">${price} USD</span> c/u
        </p>

        {localCourses.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            No hay cursos adicionales disponibles por ahora.
          </div>
        ) : (
          <div className="grid gap-3">
            {localCourses.map(course => (
              <div key={course.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col gap-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-[#1B4F8C] bg-blue-50 px-2 py-0.5 rounded-full">
                        {course.levelName}
                      </span>
                      {statusBadge(course.enrollmentStatus)}
                    </div>
                    <h2 className="font-bold text-gray-900 mt-1.5 text-base leading-snug">{course.title}</h2>
                    {course.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{course.description}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      {course.lessonCount} lecciones
                    </span>
                    {course.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {course.duration}
                      </span>
                    )}
                  </div>

                  {!course.enrollmentStatus || course.enrollmentStatus === 'rejected' ? (
                    <button
                      onClick={() => setSelected(course)}
                      className="px-4 py-1.5 rounded-xl bg-[#1B4F8C] text-white text-xs font-semibold hover:bg-[#163e6e] transition-colors"
                    >
                      Agregar — ${price} USD
                    </button>
                  ) : course.enrollmentStatus === 'active' ? (
                    <a
                      href={`/dashboard/courses/${course.id}`}
                      className="px-4 py-1.5 rounded-xl bg-[#00B5B5] text-white text-xs font-semibold hover:bg-[#009999] transition-colors"
                    >
                      Ir al curso
                    </a>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-y-auto max-h-[90vh]">
            {done ? (
              <div className="p-8 text-center flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center">
                  <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900">Pago enviado</h3>
                <p className="text-sm text-gray-500">
                  Tu pago esta en revision. Recibirás acceso al curso <strong>{selected.title}</strong> una vez que sea aprobado.
                </p>
                <button onClick={closeModal} className="mt-2 px-6 py-2.5 rounded-xl bg-[#1B4F8C] text-white font-semibold text-sm hover:bg-[#163e6e] transition-colors">
                  Entendido
                </button>
              </div>
            ) : (
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-bold text-gray-900">Pagar curso</h3>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{selected.title}</p>
                  </div>
                  <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="text-2xl font-black text-gray-900 mb-5">${price} USD</div>

                {/* Method selector */}
                <div className="flex gap-2 mb-4">
                  {(['pago_movil', 'binance_usdt'] as PaymentMethod[]).map(m => (
                    <button
                      key={m}
                      onClick={() => setMethod(m)}
                      className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                        method === m
                          ? 'border-[#1B4F8C] bg-blue-50 text-[#1B4F8C]'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {m === 'pago_movil' ? 'Pago Movil' : 'Binance USDT'}
                    </button>
                  ))}
                </div>

                {/* Account details */}
                {selectedAccount && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-4 text-sm space-y-1.5">
                    <p className="font-semibold text-gray-700 mb-2">{selectedAccount.label}</p>
                    {Object.entries(selectedAccount.details).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <span className="text-gray-500 capitalize">{k}</span>
                        <span className="font-medium text-gray-800 text-right ml-4 break-all">{v as string}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Reference */}
                <div className="mb-3">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Numero de referencia / confirmacion</label>
                  <input
                    type="text"
                    value={reference}
                    onChange={e => setReference(e.target.value)}
                    placeholder="Ej: 123456789"
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8C] transition-colors"
                  />
                </div>

                {/* Date */}
                <div className="mb-5">
                  <label className="text-xs font-semibold text-gray-600 block mb-1">Fecha del pago</label>
                  <input
                    type="date"
                    value={paymentDate}
                    onChange={e => setPaymentDate(e.target.value)}
                    max={todayStr()}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#1B4F8C] transition-colors"
                  />
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!reference.trim() || submitting}
                  className="w-full py-3 rounded-xl bg-[#1B4F8C] text-white font-semibold text-sm hover:bg-[#163e6e] disabled:opacity-40 transition-colors"
                >
                  {submitting ? 'Enviando...' : 'Confirmar pago'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
