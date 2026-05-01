'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface QuizQuestion {
  question: string
  options: [string, string, string, string]
  correctIndex: number
  explanation: string
}

type ContentType = 'video' | 'article' | 'slides'

interface LessonData {
  title?: string
  displayOrder?: number
  duration?: string | null
  isFreePreview?: boolean
  lessonType?: string
  videoUrl?: string | null
  content?: string | null
  slidesUrl?: string | null
  quizData?: { questions?: QuizQuestion[] } | null
}

interface Props {
  courseId: string
  lessonId?: string
  initialData?: LessonData
  backUrl: string
}

const inputCls = 'w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00B5B5]/30 focus:border-[#00B5B5] transition-all bg-white'
const labelCls = 'block text-sm font-medium text-gray-700 mb-1.5'

function emptyQuestion(): QuizQuestion {
  return { question: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' }
}

function initContentType(lessonType?: string): ContentType {
  if (lessonType === 'article') return 'article'
  if (lessonType === 'slides') return 'slides'
  return 'video'
}

export default function LessonEditor({ courseId, lessonId, initialData, backUrl }: Props) {
  const router = useRouter()
  const isEdit = !!lessonId

  const initQuestions = initialData?.quizData?.questions ?? []
  const [title, setTitle] = useState(initialData?.title ?? '')
  const [displayOrder, setDisplayOrder] = useState(String(initialData?.displayOrder ?? 0))
  const [duration, setDuration] = useState(initialData?.duration ?? '')
  const [isFreePreview, setIsFreePreview] = useState(initialData?.isFreePreview ?? false)
  const [contentType, setContentType] = useState<ContentType>(initContentType(initialData?.lessonType))
  const [videoUrl, setVideoUrl] = useState(initialData?.videoUrl ?? '')
  const [content, setContent] = useState(initialData?.content ?? '')
  const [slidesUrl, setSlidesUrl] = useState(initialData?.slidesUrl ?? '')
  const [questions, setQuestions] = useState<QuizQuestion[]>(initQuestions)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState<string | null>(null)

  async function handleSave() {
    if (!title.trim()) { setError('El titulo es obligatorio'); return }
    if (questions.length === 0) { setError('El quiz es obligatorio. Agrega al menos una pregunta o usa el boton de IA.'); return }
    setSaving(true)
    setError(null)

    const payload = {
      title: title.trim(),
      displayOrder: Number(displayOrder),
      duration: duration.trim() || null,
      isFreePreview,
      lessonType: contentType,
      videoUrl: contentType === 'video' ? (videoUrl.trim() || null) : null,
      content: content.trim() || null,
      slidesUrl: contentType === 'slides' ? (slidesUrl.trim() || null) : null,
      quizData: questions.length > 0 ? { questions } : null,
    }

    const method = isEdit ? 'PUT' : 'POST'
    const url = isEdit
      ? `/api/admin/lessons/${lessonId}`
      : `/api/admin/courses/${courseId}/lessons`

    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })

    setSaving(false)
    if (res.ok) {
      router.push(backUrl)
    } else {
      const data = await res.json().catch(() => ({}))
      setError(data.error ?? 'Error al guardar la leccion')
    }
  }

  async function generateQuiz() {
    setGenerating(true)
    setGenError(null)
    try {
      const res = await fetch('/api/admin/lessons/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      })
      const data = await res.json()
      if (!res.ok) { setGenError(data.error ?? 'Error al generar'); return }
      const newQs: QuizQuestion[] = (data.questions ?? []).map((q: Partial<QuizQuestion>) => ({
        question: q.question ?? '',
        options: (q.options ?? ['', '', '', '']).slice(0, 4) as [string, string, string, string],
        correctIndex: q.correctIndex ?? 0,
        explanation: q.explanation ?? '',
      }))
      setQuestions(prev => [...prev, ...newQs])
    } catch {
      setGenError('No se pudo conectar con la IA')
    } finally {
      setGenerating(false)
    }
  }

  function updateQuestion(i: number, field: keyof QuizQuestion, value: unknown) {
    setQuestions(prev => prev.map((q, idx) => idx === i ? { ...q, [field]: value } : q))
  }

  function updateOption(qi: number, oi: number, val: string) {
    setQuestions(prev => prev.map((q, idx) => {
      if (idx !== qi) return q
      const opts = [...q.options] as [string, string, string, string]
      opts[oi] = val
      return { ...q, options: opts }
    }))
  }

  function removeQuestion(i: number) {
    setQuestions(prev => prev.filter((_, idx) => idx !== i))
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <button onClick={() => router.push(backUrl)} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors mb-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Volver a lecciones
          </button>
          <h1 className="text-xl font-bold text-gray-900">{isEdit ? 'Editar leccion' : 'Nueva leccion'}</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-[#00B5B5] hover:bg-[#009999] disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-all"
        >
          {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear leccion'}
        </button>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl">{error}</div>
      )}

      <div className="flex flex-col gap-5">

        {/* ─── Informacion basica ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Informacion basica</h2>

          <div>
            <label className={labelCls}>Titulo *</label>
            <input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Ej: Introduccion al balance general"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Orden</label>
              <input type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className={labelCls}>Duracion estimada</label>
              <input value={duration} onChange={e => setDuration(e.target.value)} placeholder="Ej: 12m" className={inputCls} />
            </div>
          </div>

          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <button
              type="button"
              onClick={() => setIsFreePreview(p => !p)}
              className={`w-9 h-5 rounded-full transition-colors shrink-0 ${isFreePreview ? 'bg-[#00B5B5]' : 'bg-gray-200'}`}
            >
              <div className="w-4 h-4 bg-white rounded-full shadow mt-0.5 transition-transform" style={{ transform: isFreePreview ? 'translateX(18px)' : 'translateX(2px)' }} />
            </button>
            <span className="text-sm text-gray-700">Vista previa gratuita (visible sin completar lecciones anteriores)</span>
          </label>
        </div>

        {/* ─── Tipo de contenido ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Tipo de contenido</h2>

          <div className="flex gap-2">
            {(['video', 'article', 'slides'] as ContentType[]).map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setContentType(t)}
                className={`flex-1 py-2.5 px-3 rounded-xl border-2 text-xs font-semibold transition-all ${
                  contentType === t ? 'border-[#00B5B5] bg-[#E6F8F8] text-[#007B7D]' : 'border-gray-200 text-gray-500 hover:border-gray-300'
                }`}
              >
                {t === 'video' ? 'Video' : t === 'article' ? 'Articulo' : 'Diapositivas'}
              </button>
            ))}
          </div>

          {contentType === 'video' && (
            <div>
              <label className={labelCls}>URL del video</label>
              <input
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... o https://youtu.be/..."
                className={inputCls}
              />
              <p className="text-xs text-gray-400 mt-1">Compatible con YouTube y Vimeo</p>
            </div>
          )}

          {contentType === 'slides' && (
            <div>
              <label className={labelCls}>URL de diapositivas</label>
              <input
                value={slidesUrl}
                onChange={e => setSlidesUrl(e.target.value)}
                placeholder="https://docs.google.com/presentation/d/.../embed"
                className={inputCls}
              />
              <p className="text-xs text-gray-400 mt-1">Usa el enlace de publicacion de Google Slides o cualquier URL iframe-able</p>
            </div>
          )}

          {contentType === 'article' && (
            <p className="text-xs text-gray-400">El contenido del articulo se escribe en la seccion de abajo.</p>
          )}
        </div>

        {/* ─── Contenido / Descripcion ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
            {contentType === 'article' ? 'Contenido del articulo' : 'Descripcion y notas'}
          </h2>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={contentType === 'article' ? 14 : 5}
            placeholder={
              contentType === 'article'
                ? 'Escribe el contenido completo de la leccion aqui. Soporta Markdown (negritas, listas, encabezados...).'
                : 'Descripcion o notas adicionales de la leccion (opcional)...'
            }
            className={`${inputCls} resize-y leading-relaxed font-mono text-[13px]`}
          />
          {contentType === 'article' && (
            <p className="text-xs text-gray-400">Soporta Markdown: **negrita**, *italica*, ## Encabezado, - lista, `codigo`</p>
          )}
        </div>

        {/* ─── Quiz de verificacion (obligatorio) ─── */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide">Quiz de verificacion</h2>
            <p className="text-xs text-gray-400 mt-0.5">Obligatorio. El estudiante debe completarlo para avanzar a la siguiente leccion.</p>
          </div>

          {/* AI generate button */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={generateQuiz}
              disabled={generating || !title.trim()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-40 text-white text-sm font-semibold transition-all"
            >
              {generating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Generando...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                  </svg>
                  Generar con IA
                </>
              )}
            </button>
            <p className="text-xs text-gray-400">Genera preguntas basadas en el titulo y contenido de la leccion</p>
          </div>

          {genError && (
            <p className="text-xs text-red-600">{genError}</p>
          )}

          {/* Questions list */}
          {questions.length > 0 && (
            <div className="flex flex-col gap-4">
              {questions.map((q, qi) => (
                <div key={qi} className="border border-gray-200 rounded-xl p-4 flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Pregunta {qi + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeQuestion(qi)}
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <textarea
                    value={q.question}
                    onChange={e => updateQuestion(qi, 'question', e.target.value)}
                    rows={2}
                    placeholder="Escribe la pregunta..."
                    className={`${inputCls} resize-none`}
                  />

                  <div className="grid grid-cols-2 gap-2">
                    {q.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateQuestion(qi, 'correctIndex', oi)}
                          title={q.correctIndex === oi ? 'Respuesta correcta' : 'Marcar como correcta'}
                          className={`w-5 h-5 rounded-full border-2 shrink-0 transition-colors ${
                            q.correctIndex === oi
                              ? 'bg-green-500 border-green-500'
                              : 'border-gray-300 hover:border-green-400'
                          }`}
                        />
                        <input
                          value={opt}
                          onChange={e => updateOption(qi, oi, e.target.value)}
                          placeholder={`Opcion ${String.fromCharCode(65 + oi)}`}
                          className={inputCls}
                        />
                      </div>
                    ))}
                  </div>

                  <input
                    value={q.explanation}
                    onChange={e => updateQuestion(qi, 'explanation', e.target.value)}
                    placeholder="Explicacion de la respuesta correcta (opcional)"
                    className={inputCls}
                  />
                </div>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setQuestions(prev => [...prev, emptyQuestion()])}
            className="flex items-center gap-2 text-sm text-[#00B5B5] hover:text-[#009999] font-semibold transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            Agregar pregunta manualmente
          </button>

          {questions.length === 0 && (
            <p className="text-xs text-amber-600 font-medium text-center py-2 bg-amber-50 rounded-xl">
              Sin preguntas. Usa el boton de IA o agrega manualmente antes de guardar.
            </p>
          )}
        </div>

        {/* Bottom save */}
        <div className="flex justify-end pb-8">
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-[#00B5B5] hover:bg-[#009999] disabled:opacity-60 text-white text-sm font-semibold px-6 py-3 rounded-xl transition-all"
          >
            {saving ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear leccion'}
          </button>
        </div>

      </div>
    </div>
  )
}
