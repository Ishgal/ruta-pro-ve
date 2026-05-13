'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { motion, AnimatePresence } from 'framer-motion'
import ExamModal from '@/components/dashboard/ExamModal'
import AdBanner from '@/components/dashboard/AdBanner'
import BadgeNotification from '@/components/dashboard/BadgeNotification'

type LessonType = 'video' | 'article' | 'quiz' | 'slides'

type QuizQuestion = { question: string; options: string[]; correctIndex: number }
type QuizData = { questions: QuizQuestion[] }

export type PlayerLesson = {
  id: string
  title: string
  videoUrl: string | null
  content: string | null
  slidesUrl: string | null
  displayOrder: number
  duration: string | null
  lessonType: LessonType
  quizData: unknown
  isCompleted: boolean
}

type Props = {
  courseId: string
  courseTitle: string
  lessons: PlayerLesson[]
  initialActiveLessonId: string
  totalLessons: number
  initialExamPassed: boolean
  userPlan: string
  teacherId: string | null
  hasExistingRating: boolean
  quizResults: Record<string, Record<string, number>>
}

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  return m ? m[1] : null
}

function getEmbedUrl(url: string): string | null {
  const ytId = extractYouTubeId(url)
  if (ytId) return `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`
  const vimeo = url.match(/vimeo\.com\/(\d+)/)
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`
  return null
}

function lessonTypeLabel(type: LessonType): string {
  if (type === 'video') return 'Video'
  if (type === 'quiz') return 'Evaluacion'
  if (type === 'slides') return 'Diapositivas'
  return 'Lectura'
}

const VIDEO_BASE = 'w-full aspect-video bg-[#0D1117] rounded-2xl overflow-hidden relative'

function SlidesPlayer({ lesson }: { lesson: PlayerLesson }) {
  if (!lesson.slidesUrl) {
    return (
      <div className={`${VIDEO_BASE} flex flex-col items-center justify-center gap-3`}>
        <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3h16.5M3.75 12h16.5M3.75 21h16.5M15 3v18M9 3v18" />
        </svg>
        <p className="text-white/25 text-xs">Diapositivas no disponibles</p>
      </div>
    )
  }
  // Google Slides embed or generic iframe
  const isGoogleSlides = lesson.slidesUrl.includes('docs.google.com/presentation')
  const embedUrl = isGoogleSlides && !lesson.slidesUrl.includes('/embed')
    ? lesson.slidesUrl.replace('/pub', '/embed').replace(/\/edit.*$/, '/embed')
    : lesson.slidesUrl
  return (
    <div className={VIDEO_BASE}>
      <iframe
        src={embedUrl}
        className="absolute inset-0 w-full h-full"
        allowFullScreen
        frameBorder="0"
      />
    </div>
  )
}

function VideoPlayer({ lesson }: { lesson: PlayerLesson }) {
  const [playing, setPlaying] = useState(false)

  if (lesson.lessonType !== 'video') {
    return null
  }

  if (!lesson.videoUrl) {
    return (
      <div className={`${VIDEO_BASE} flex flex-col items-center justify-center gap-3`}>
        <svg className="w-10 h-10 text-white/20" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
        </svg>
        <p className="text-white/25 text-xs">Video no disponible aun</p>
      </div>
    )
  }

  const embedUrl = getEmbedUrl(lesson.videoUrl)

  if (!embedUrl) {
    return (
      <div className={VIDEO_BASE}>
        <video src={lesson.videoUrl} controls className="absolute inset-0 w-full h-full object-contain" />
      </div>
    )
  }

  const ytId = extractYouTubeId(lesson.videoUrl)
  const thumbnail = ytId ? `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg` : null

  if (playing) {
    return (
      <div className={VIDEO_BASE}>
        <iframe
          src={`${embedUrl}&autoplay=1`}
          className="absolute inset-0 w-full h-full"
          allowFullScreen
          allow="autoplay; accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    )
  }

  return (
    <div
      className={`${VIDEO_BASE} cursor-pointer group`}
      onClick={() => setPlaying(true)}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0D1117] to-[#1a2744]" />
      )}

      <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-colors duration-200" />

      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-[72px] h-[72px] rounded-full bg-[#1B4F8C] group-hover:scale-110 group-hover:bg-[#1a6ab5] transition-all duration-200 flex items-center justify-center shadow-2xl ring-4 ring-white/10">
          <svg className="w-8 h-8 text-white ml-1.5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>

      {lesson.duration && (
        <div className="absolute bottom-3 right-3 bg-black/70 text-white text-[11px] px-2.5 py-1 rounded-md font-medium tracking-wide">
          {lesson.duration}
        </div>
      )}
    </div>
  )
}

function QuizSection({
  lessonId,
  courseId,
  quizData,
  onComplete,
  disabled,
  isCompleted,
  initialAnswers,
}: {
  lessonId: string
  courseId: string
  quizData: QuizData
  onComplete: () => void
  disabled: boolean
  isCompleted: boolean
  initialAnswers: Record<string, number> | null
}) {
  const [localAnswers, setLocalAnswers] = useState<Record<number, number>>({})
  const [localSubmitted, setLocalSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)

  // Derivar estado: si el servidor ya tiene datos, mostrarlos directamente
  const submitted = localSubmitted || initialAnswers !== null
  const answers: Record<number, number> = localSubmitted
    ? localAnswers
    : initialAnswers !== null
      ? (initialAnswers as unknown as Record<number, number>)
      : localAnswers

  async function handleVerify() {
    setSaving(true)
    try {
      await fetch(`/api/courses/${courseId}/quiz-result`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId, answers: localAnswers }),
      })
    } finally {
      setSaving(false)
      setLocalSubmitted(true)
    }
  }

  const questions = quizData.questions ?? []
  const allAnswered = questions.every((_, i) => localAnswers[i] !== undefined)
  const correctCount = submitted
    ? questions.filter((q, i) => answers[i] === q.correctIndex).length
    : 0

  return (
    <div className="bg-white px-5 py-5 border-b border-gray-100">
      <p className="text-[10px] font-semibold text-[#00B5B5] uppercase tracking-wide mb-4">Evaluacion</p>
      <div className="flex flex-col gap-6">
        {questions.map((q, qi) => (
          <div key={qi}>
            <p className="text-sm font-medium text-gray-900 mb-3">{qi + 1}. {q.question}</p>
            <div className="flex flex-col gap-2">
              {q.options.map((opt, oi) => {
                const isSelected = answers[qi] === oi
                const isCorrect = q.correctIndex === oi
                let cls = 'border border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                if (submitted) {
                  if (isCorrect) cls = 'border border-green-400 bg-green-50 text-green-800'
                  else if (isSelected) cls = 'border border-red-300 bg-red-50 text-red-700'
                  else cls = 'border border-gray-100 text-gray-400'
                } else if (isSelected) {
                  cls = 'border border-[#00B5B5] bg-[#E6F8F8] text-[#007B7D]'
                }
                return (
                  <button
                    key={oi}
                    onClick={() => !submitted && setLocalAnswers(prev => ({ ...prev, [qi]: oi }))}
                    className={`text-left text-sm px-4 py-3 rounded-xl transition-all ${cls}`}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3 mt-5">
        {isCompleted ? (
          <div className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-green-50 text-green-700 text-sm font-semibold">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
            </svg>
            Leccion completada
          </div>
        ) : !submitted ? (
          <button
            disabled={!allAnswered || saving}
            onClick={handleVerify}
            className="px-5 py-2.5 rounded-xl bg-[#1B4F8C] disabled:opacity-40 text-white text-sm font-semibold transition-all hover:bg-[#163e6e]"
          >
            {saving ? 'Guardando...' : 'Verificar respuestas'}
          </button>
        ) : (
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-700">
              <span className="font-bold text-[#00B5B5]">{correctCount}</span> de {questions.length} correctas
            </p>
            <button
              onClick={onComplete}
              disabled={disabled}
              className="px-5 py-2.5 rounded-xl bg-[#00B5B5] disabled:opacity-40 hover:bg-[#009999] text-white text-sm font-semibold transition-all"
            >
              Marcar como completada
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function CoursePlayerClient({
  courseId,
  courseTitle,
  lessons,
  initialActiveLessonId,
  totalLessons,
  initialExamPassed,
  userPlan,
  teacherId,
  hasExistingRating,
  quizResults,
}: Props) {
  const router = useRouter()
  const [activeLessonId, setActiveLessonId] = useState(initialActiveLessonId)
  const [completedIds, setCompletedIds] = useState(
    () => new Set(lessons.filter(l => l.isCompleted).map(l => l.id))
  )
  const [marking, setMarking] = useState(false)
  const [examPassed, setExamPassed] = useState(initialExamPassed)
  const [examOpen, setExamOpen] = useState(false)
  const [certNotifOpen, setCertNotifOpen] = useState(false)
  const [adOpen, setAdOpen] = useState(false)
  const [earnedBadges, setEarnedBadges] = useState<{ name: string; icon: string; description: string }[]>([])
  const [ratingOpen, setRatingOpen] = useState(false)
  const [selectedRating, setSelectedRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [ratingComment, setRatingComment] = useState('')
  const [submittingRating, setSubmittingRating] = useState(false)
  const [ratingDone, setRatingDone] = useState(hasExistingRating)
  const pendingLessonRef = useRef<string | null>(null)
  const justPassedRef = useRef(false)
  const isBronce = userPlan === 'bronce'
  const canRate = userPlan === 'oro' && !!teacherId && !ratingDone

  // Scroll al inicio de la leccion cada vez que cambia
  useEffect(() => {
    document.querySelector('main')?.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [activeLessonId])

  // Show ad on course entry for bronce users
  useEffect(() => {
    if (isBronce) setAdOpen(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const completedCount = completedIds.size
  const allLessonsComplete = completedCount >= totalLessons
  // 99% from lessons, final 1% from exam
  const progressPercent = examPassed
    ? 100
    : totalLessons > 0
      ? Math.min(99, Math.round((completedCount / totalLessons) * 100))
      : 0
  const allComplete = examPassed

  const activeLesson = lessons.find(l => l.id === activeLessonId) ?? lessons[0]
  const activeLessonIndex = lessons.findIndex(l => l.id === activeLesson?.id)

  function isAccessible(index: number): boolean {
    if (index === 0) return true
    const lesson = lessons[index]
    if (completedIds.has(lesson.id)) return true
    return completedIds.has(lessons[index - 1].id)
  }

  function navigateTo(lessonId: string) {
    if (isBronce) {
      pendingLessonRef.current = lessonId
      setAdOpen(true)
    } else {
      setActiveLessonId(lessonId)
    }
  }

  function selectLesson(lesson: PlayerLesson, index: number) {
    if (!isAccessible(index)) return
    navigateTo(lesson.id)
  }

  async function markComplete(lessonId?: string) {
    const targetId = lessonId ?? activeLesson?.id
    if (!targetId || completedIds.has(targetId) || marking) return
    setMarking(true)
    try {
      const res = await fetch(`/api/courses/${courseId}/progress`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: targetId }),
      })
      if (res.ok) {
        const data = await res.json()
        setCompletedIds(prev => new Set([...prev, targetId]))
        if (data.newBadges?.length > 0) setEarnedBadges(data.newBadges)
        const currentIdx = lessons.findIndex(l => l.id === targetId)
        const next = lessons[currentIdx + 1]
        if (next) navigateTo(next.id)
      }
    } finally {
      setMarking(false)
    }
  }

  async function submitRating() {
    if (!teacherId || selectedRating === 0 || submittingRating) return
    setSubmittingRating(true)
    try {
      const res = await fetch(`/api/teachers/${teacherId}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId, rating: selectedRating, comment: ratingComment.trim() || undefined }),
      })
      if (res.ok) {
        setRatingDone(true)
        setRatingOpen(false)
      }
    } finally {
      setSubmittingRating(false)
    }
  }

  const isActiveCompleted = completedIds.has(activeLesson?.id ?? '')
  const quizData = activeLesson?.quizData as QuizData | null
  // Quiz can be attached to any lesson type
  const hasQuiz = (quizData?.questions?.length ?? 0) > 0

  return (
    <div className="min-h-full bg-[#F4F6F9] px-4 pt-4 pb-28 md:p-5">
      <div className="flex flex-col md:flex-row gap-4 md:gap-5">

        {/* ——— COLUMNA IZQUIERDA (flex-[3] ≈ 60%) — en mobile: order-2 ——— */}
        <div className="flex-[3] min-w-0 flex flex-col order-2 md:order-1">
          <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeLessonId}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -20, opacity: 0 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="flex flex-col gap-4"
          >

          {/* 1. Video */}
          {activeLesson?.lessonType === 'video' && <VideoPlayer lesson={activeLesson} />}

          {/* 2. Diapositivas */}
          {activeLesson?.lessonType === 'slides' && <SlidesPlayer lesson={activeLesson} />}

          {/* 3. Artículo — banner decorativo */}
          {(activeLesson?.lessonType === 'article' || activeLesson?.lessonType === 'quiz') && (
            <div className="bg-gradient-to-br from-[#1B4F8C] to-[#00B5B5] rounded-2xl p-7 flex items-center gap-5">
              <div className="w-14 h-14 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>
              <div>
                <p className="text-[11px] font-semibold text-white/60 uppercase tracking-wider mb-1">{courseTitle} · Lectura</p>
                <h2 className="text-lg font-bold text-white leading-snug">{activeLesson.title}</h2>
                {activeLesson.duration && <p className="text-sm text-white/60 mt-0.5">{activeLesson.duration}</p>}
              </div>
            </div>
          )}

          {/* 4. Info: título (video/slides) + descripción + navegación */}
          <div className="bg-white rounded-2xl px-5 py-5">
            {activeLesson?.lessonType !== 'article' && activeLesson?.lessonType !== 'quiz' && (
              <>
                <p className="text-[10px] font-semibold text-[#00B5B5] uppercase tracking-wide mb-1">{courseTitle}</p>
                <h2 className="text-base font-bold text-gray-900">{activeLesson?.title}</h2>
                {activeLesson?.duration && (
                  <p className="text-xs text-gray-400 mt-0.5">{activeLesson.duration}</p>
                )}
              </>
            )}

            {activeLesson?.content && (
              <div className={`prose prose-sm max-w-none text-gray-600 leading-relaxed ${
                activeLesson.lessonType === 'article' || activeLesson.lessonType === 'quiz' ? '' : 'mt-3'
              }`}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {activeLesson.content}
                </ReactMarkdown>
              </div>
            )}

            {(activeLesson?.lessonType === 'article' || activeLesson?.lessonType === 'quiz') && !activeLesson.content && (
              <p className="text-sm text-gray-400 italic">Esta leccion no tiene contenido todavia.</p>
            )}

            <div className="flex items-center gap-3 mt-4 flex-wrap">
              {activeLessonIndex > 0 && (
                <button
                  onClick={() => selectLesson(lessons[activeLessonIndex - 1], activeLessonIndex - 1)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 transition-all"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                  </svg>
                  Anterior
                </button>
              )}

              {!hasQuiz && (
                isActiveCompleted ? (
                  <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-semibold">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                    Completada
                  </div>
                ) : (
                  <button
                    onClick={() => markComplete()}
                    disabled={marking}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#00B5B5] hover:bg-[#009999] disabled:opacity-50 text-white text-xs font-semibold transition-all"
                  >
                    {marking ? (
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                    ) : (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    )}
                    {marking ? 'Guardando...' : 'Marcar como completada'}
                  </button>
                )
              )}

              {hasQuiz && isActiveCompleted && (
                <div className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-green-50 text-green-700 text-xs font-semibold">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Completada
                </div>
              )}

              {activeLessonIndex < lessons.length - 1 && (
                <button
                  onClick={() => {
                    const next = lessons[activeLessonIndex + 1]
                    if (isAccessible(activeLessonIndex + 1)) navigateTo(next.id)
                  }}
                  disabled={!isAccessible(activeLessonIndex + 1)}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed px-3 py-2 rounded-lg border border-gray-200 hover:border-gray-300 disabled:hover:border-gray-200 transition-all ml-auto"
                >
                  Siguiente
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* 5. Evaluación interactiva — SIEMPRE AL FINAL */}
          {hasQuiz && quizData && (
            <div className="rounded-2xl overflow-hidden">
              <QuizSection
                key={activeLesson?.id}
                lessonId={activeLesson?.id ?? ''}
                courseId={courseId}
                quizData={quizData}
                disabled={marking}
                isCompleted={isActiveCompleted}
                onComplete={() => markComplete(activeLesson?.id)}
                initialAnswers={quizResults[activeLesson?.id ?? ''] ?? null}
              />
            </div>
          )}

          </motion.div>
          </AnimatePresence>
        </div>

        {/* ——— COLUMNA DERECHA (flex-[2] ≈ 40%) — en mobile: order-1, aparece primero ——— */}
        <div className="flex-[2] md:min-w-[260px] flex flex-col gap-4 order-1 md:order-2">

          {/* Tarjeta 1: Tu Progreso */}
          <div className="bg-white rounded-2xl px-4 py-3.5 md:p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-800">Tu Progreso</p>
              <span className="text-base md:text-xl font-bold text-[#00B5B5]">{progressPercent}%</span>
            </div>
            <div className="h-2 md:h-2.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00B5B5] rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1.5">
              {examPassed
                ? 'Curso completado. Felicidades.'
                : allLessonsComplete
                  ? 'Aprueba el examen final para completar el curso.'
                  : `${completedCount} de ${totalLessons} lecciones completadas.`}
            </p>
          </div>

          {/* Tarjeta 2: Contenido del Curso */}
          <div className="bg-[#EEEEF3] rounded-2xl p-4 flex flex-col">
            <p className="text-sm font-bold text-gray-800 mb-3">Contenido del Curso</p>

            <div className="flex flex-col gap-0.5">
              {lessons.map((lesson, index) => {
                const isActive = lesson.id === activeLessonId
                const isComplete = completedIds.has(lesson.id)
                const accessible = isAccessible(index)
                return (
                  <button
                    key={lesson.id}
                    onClick={() => selectLesson(lesson, index)}
                    disabled={!accessible}
                    className={`w-full text-left px-3 py-3 rounded-xl flex items-center gap-3 transition-all ${
                      isActive ? 'bg-white shadow-sm' : accessible ? 'hover:bg-white/70' : ''
                    } ${!accessible ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  >
                    {/* Icono estado */}
                    <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center ${
                      isComplete ? 'bg-[#00B5B5]' :
                      isActive ? 'bg-[#00B5B5]' :
                      accessible ? 'bg-white border-2 border-gray-200' :
                      'bg-gray-200'
                    }`}>
                      {isComplete ? (
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      ) : isActive ? (
                        <svg className="w-3.5 h-3.5 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      ) : !accessible ? (
                        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                        </svg>
                      ) : (
                        <span className="text-[10px] font-bold text-gray-400">{index + 1}</span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className={`text-xs font-medium leading-snug truncate ${
                        isActive ? 'text-[#007B7D] font-semibold' : isComplete ? 'text-gray-600' : 'text-gray-700'
                      }`}>
                        {lesson.title}
                      </p>
                      <p className={`text-[10px] mt-0.5 ${isActive ? 'text-[#00B5B5]' : 'text-gray-400'}`}>
                        {[lesson.duration, lessonTypeLabel(lesson.lessonType)].filter(Boolean).join(' • ')}
                      </p>
                    </div>

                    {isActive && (
                      <span className="text-[10px] font-semibold text-[#007B7D] bg-[#E6F8F8] px-2 py-0.5 rounded-full flex-shrink-0 whitespace-nowrap">
                        En curso
                      </span>
                    )}
                  </button>
                )
              })}
            </div>

            {examPassed ? (
              <div className="mt-4 w-full py-3.5 rounded-xl bg-green-50 text-green-700 text-[11px] font-bold tracking-widest uppercase text-center">
                Examen Aprobado
              </div>
            ) : (
              <button
                disabled={!allLessonsComplete}
                onClick={() => allLessonsComplete && setExamOpen(true)}
                className={`mt-4 w-full py-3.5 rounded-xl text-white text-[11px] font-bold tracking-widest uppercase transition-all ${
                  allLessonsComplete ? 'bg-[#00B5B5] hover:bg-[#009999] cursor-pointer' : 'bg-[#00B5B5]/40 cursor-not-allowed'
                }`}
              >
                Examen de Modulo
              </button>
            )}
          </div>

          <Link
            href="/dashboard/courses"
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors pb-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
            Volver a mis cursos
          </Link>
        </div>

      </div>
      {examOpen && (
        <ExamModal
          courseId={courseId}
          courseTitle={courseTitle}
          onClose={() => {
            setExamOpen(false)
            if (justPassedRef.current) {
              setCertNotifOpen(true)
              justPassedRef.current = false
            }
          }}
          onPassed={(badges) => {
            justPassedRef.current = true
            setExamPassed(true)
            if (badges.length > 0) setEarnedBadges(badges)
          }}
        />
      )}

      {certNotifOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7 relative">
            <button
              onClick={() => setCertNotifOpen(false)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-[#E6F8F8] flex items-center justify-center">
                <svg className="w-8 h-8 text-[#00B5B5]" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900">Tu certificado esta listo</h3>
                <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
                  Completaste <span className="font-semibold text-gray-700">{courseTitle}</span>. Ve a tu perfil para desbloquearlo y obtener tu certificado oficial.
                </p>
              </div>

              <div className="flex flex-col gap-2 w-full mt-1">
                <button
                  onClick={() => router.push('/dashboard/profile')}
                  className="w-full py-3 rounded-xl bg-[#1B4F8C] text-white text-sm font-bold hover:bg-[#163e6e] transition-colors"
                >
                  Ver mi certificado
                </button>
                <button
                  onClick={() => {
                    setCertNotifOpen(false)
                    if (canRate) setRatingOpen(true)
                  }}
                  className="w-full py-2.5 rounded-xl text-gray-500 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  {canRate ? 'Calificar docente' : 'Continuar aqui'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {ratingOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-7">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center">
                <svg className="w-7 h-7 text-amber-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-black text-gray-900">Califica a tu docente</h3>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  Tu opinion ayuda a mejorar la experiencia para todos.
                </p>
              </div>

              {/* Estrellas */}
              <div className="flex items-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    onClick={() => setSelectedRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="transition-transform hover:scale-110"
                  >
                    <svg
                      className={`w-9 h-9 transition-colors ${
                        star <= (hoveredRating || selectedRating)
                          ? 'text-amber-400'
                          : 'text-gray-200'
                      }`}
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                    </svg>
                  </button>
                ))}
              </div>

              {/* Comentario opcional */}
              <textarea
                value={ratingComment}
                onChange={e => setRatingComment(e.target.value)}
                placeholder="Comentario opcional..."
                rows={3}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:border-[#1B4F8C] transition-colors"
              />

              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={submitRating}
                  disabled={selectedRating === 0 || submittingRating}
                  className="w-full py-3 rounded-xl bg-[#1B4F8C] text-white text-sm font-bold hover:bg-[#163e6e] disabled:opacity-40 transition-colors"
                >
                  {submittingRating ? 'Enviando...' : 'Enviar calificacion'}
                </button>
                <button
                  onClick={() => setRatingOpen(false)}
                  className="w-full py-2.5 rounded-xl text-gray-400 text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                  Omitir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {adOpen && (
        <AdBanner onClose={() => {
          setAdOpen(false)
          if (pendingLessonRef.current) {
            setActiveLessonId(pendingLessonRef.current)
            pendingLessonRef.current = null
          }
        }} />
      )}

      {earnedBadges.length > 0 && (
        <BadgeNotification
          badges={earnedBadges}
          onClose={() => setEarnedBadges([])}
        />
      )}
    </div>
  )
}

function LessonStatusIcon({
  isComplete,
  isActive,
  accessible,
  index,
}: {
  isComplete: boolean
  isActive: boolean
  accessible: boolean
  index: number
}) {
  const base = 'w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center'
  if (isComplete) {
    return (
      <div className={`${base} bg-green-100`}>
        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
        </svg>
      </div>
    )
  }
  if (isActive) {
    return (
      <div className={`${base} bg-[#00B5B5]`}>
        <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      </div>
    )
  }
  if (!accessible) {
    return (
      <div className={`${base} bg-gray-100`}>
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
        </svg>
      </div>
    )
  }
  return (
    <div className={`${base} border-2 border-gray-200`}>
      <span className="text-[10px] font-bold text-gray-400">{index + 1}</span>
    </div>
  )
}
