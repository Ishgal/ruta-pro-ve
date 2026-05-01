'use client'

import { useState, useEffect, useCallback } from 'react'
import type { ExamData, ExamQuestion } from '@/app/api/courses/[courseId]/exam/route'

type GradedResult = {
  questionId: string
  earnedPoints: number
  maxPoints: number
  correct: boolean
  feedback: string
}

type GradingResponse = {
  score: number
  passed: boolean
  earnedPoints: number
  totalPoints: number
  passingScore: number
  graded: GradedResult[]
}

type Phase = 'loading' | 'question' | 'submitting' | 'result'

interface Props {
  courseId: string
  courseTitle: string
  onClose: () => void
  onPassed: () => void
}

export default function ExamModal({ courseId, courseTitle, onClose, onPassed }: Props) {
  const [phase, setPhase] = useState<Phase>('loading')
  const [attemptId, setAttemptId] = useState<string | null>(null)
  const [examData, setExamData] = useState<ExamData | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [result, setResult] = useState<GradingResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  const generateExam = useCallback(async () => {
    setPhase('loading')
    setError(null)
    setAnswers({})
    setCurrentIndex(0)
    setResult(null)
    setAttemptId(null)
    setExamData(null)

    try {
      const res = await fetch(`/api/courses/${courseId}/exam`, { method: 'POST' })
      if (!res.ok) throw new Error('No se pudo generar el examen')
      const data = await res.json()
      setAttemptId(data.id)
      setExamData(data.examData as ExamData)
      setPhase('question')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
    }
  }, [courseId])

  useEffect(() => {
    generateExam()
  }, [generateExam])

  const currentQuestion: ExamQuestion | undefined = examData?.questions[currentIndex]
  const totalQuestions = examData?.questions.length ?? 0
  const currentAnswer = currentQuestion ? (answers[currentQuestion.id] ?? '') : ''

  function setAnswer(val: string) {
    if (!currentQuestion) return
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }))
  }

  function handleNext() {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(i => i + 1)
    } else {
      submitExam()
    }
  }

  function handlePrev() {
    if (currentIndex > 0) setCurrentIndex(i => i - 1)
  }

  async function submitExam() {
    if (!attemptId) return
    setPhase('submitting')
    try {
      const res = await fetch(`/api/courses/${courseId}/exam/${attemptId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
      })
      if (!res.ok) throw new Error('Error al calificar el examen')
      const data: GradingResponse = await res.json()
      setResult(data)
      setPhase('result')
      if (data.passed) onPassed()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error desconocido')
      setPhase('question')
    }
  }

  const isLast = currentIndex === totalQuestions - 1
  const answeredAll = examData?.questions.every(q => (answers[q.id] ?? '').trim() !== '')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Examen Final</p>
            <h2 className="text-base font-bold text-gray-900 leading-tight">{courseTitle}</h2>
          </div>
          {phase !== 'submitting' && phase !== 'loading' && (
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">

          {/* Loading */}
          {phase === 'loading' && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-[#00B5B5] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Generando tu examen personalizado...</p>
            </div>
          )}

          {/* Error */}
          {error && phase !== 'loading' && (
            <div className="px-6 py-4">
              <div className="bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">{error}</div>
            </div>
          )}

          {/* Question */}
          {phase === 'question' && currentQuestion && (
            <div className="px-6 py-5">
              {/* Progress */}
              <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                <span>Pregunta {currentIndex + 1} de {totalQuestions}</span>
                <span>{currentQuestion.points} pts</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-5">
                <div
                  className="h-full bg-[#00B5B5] rounded-full transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
                />
              </div>

              {/* Type badge */}
              <span className={`inline-block text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded mb-3 ${
                currentQuestion.type === 'development' ? 'bg-purple-50 text-purple-600' :
                currentQuestion.type === 'exercise' ? 'bg-blue-50 text-blue-600' :
                currentQuestion.type === 'true_false' ? 'bg-amber-50 text-amber-600' :
                currentQuestion.type === 'fill_blank' ? 'bg-green-50 text-green-600' :
                'bg-gray-100 text-gray-500'
              }`}>
                {currentQuestion.type === 'multiple_choice' ? 'Seleccion multiple' :
                 currentQuestion.type === 'true_false' ? 'Verdadero / Falso' :
                 currentQuestion.type === 'development' ? 'Desarrollo' :
                 currentQuestion.type === 'fill_blank' ? 'Completar' :
                 'Ejercicio practico'}
              </span>

              <p className="text-sm font-semibold text-gray-800 leading-relaxed mb-5">
                {currentQuestion.question}
              </p>

              {/* Inputs by type */}
              {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                <div className="flex flex-col gap-2">
                  {currentQuestion.options.map(opt => (
                    <button
                      key={opt}
                      onClick={() => setAnswer(opt)}
                      className={`text-left text-sm px-4 py-3 rounded-xl border-2 transition-all ${
                        currentAnswer === opt
                          ? 'border-[#00B5B5] bg-[#E6F8F8] text-[#007B7D] font-medium'
                          : 'border-gray-200 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'true_false' && (
                <div className="flex gap-3">
                  {['Verdadero', 'Falso'].map(opt => (
                    <button
                      key={opt}
                      onClick={() => setAnswer(opt)}
                      className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition-all ${
                        currentAnswer === opt
                          ? 'border-[#00B5B5] bg-[#E6F8F8] text-[#007B7D]'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}

              {currentQuestion.type === 'fill_blank' && (
                <input
                  type="text"
                  value={currentAnswer}
                  onChange={e => setAnswer(e.target.value)}
                  placeholder="Escribe tu respuesta..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00B5B5] transition-colors"
                />
              )}

              {(currentQuestion.type === 'development' || currentQuestion.type === 'exercise') && (
                <textarea
                  value={currentAnswer}
                  onChange={e => setAnswer(e.target.value)}
                  rows={5}
                  placeholder="Desarrolla tu respuesta aqui..."
                  className="w-full border-2 border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-800 focus:outline-none focus:border-[#00B5B5] transition-colors resize-none"
                />
              )}
            </div>
          )}

          {/* Submitting */}
          {phase === 'submitting' && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-10 h-10 border-4 border-[#1B4F8C] border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-gray-500">Calificando tu examen con IA...</p>
              <p className="text-xs text-gray-400">Las respuestas de desarrollo pueden tardar unos segundos</p>
            </div>
          )}

          {/* Result */}
          {phase === 'result' && result && (
            <div className="px-6 py-5">
              {/* Score circle */}
              <div className="flex flex-col items-center mb-6">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold mb-3 ${
                  result.passed ? 'bg-[#E6F8F8] text-[#007B7D]' : 'bg-red-50 text-red-600'
                }`}>
                  {result.score}%
                </div>
                <h3 className={`text-lg font-bold mb-1 ${result.passed ? 'text-[#007B7D]' : 'text-red-600'}`}>
                  {result.passed ? 'Aprobado' : 'No aprobado'}
                </h3>
                <p className="text-xs text-gray-400">
                  {result.earnedPoints} / {result.totalPoints} puntos — minimo aprobatorio: {result.passingScore}%
                </p>
              </div>

              {/* Per-question breakdown */}
              <div className="flex flex-col gap-2">
                {result.graded.map((g, i) => {
                  const q = examData?.questions.find(qq => qq.id === g.questionId)
                  return (
                    <div
                      key={g.questionId}
                      className={`rounded-xl px-4 py-3 border ${
                        g.correct ? 'border-green-100 bg-green-50' : 'border-red-100 bg-red-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="text-xs font-semibold text-gray-700 flex-1 leading-snug">
                          P{i + 1}: {q?.question ?? ''}
                        </p>
                        <span className={`text-xs font-bold whitespace-nowrap flex-shrink-0 ${
                          g.correct ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {g.earnedPoints}/{g.maxPoints} pts
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed">{g.feedback}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between gap-3">
          {phase === 'question' && (
            <>
              <button
                onClick={handlePrev}
                disabled={currentIndex === 0}
                className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-30 transition-colors"
              >
                Anterior
              </button>
              <button
                onClick={handleNext}
                disabled={!currentAnswer.trim()}
                className="flex-1 py-2.5 rounded-xl bg-[#00B5B5] hover:bg-[#009999] disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
              >
                {isLast ? (answeredAll ? 'Enviar examen' : 'Enviar') : 'Siguiente'}
              </button>
            </>
          )}

          {phase === 'result' && (
            <>
              {!result?.passed && (
                <button
                  onClick={generateExam}
                  className="flex-1 py-2.5 rounded-xl border-2 border-[#00B5B5] text-[#007B7D] text-sm font-semibold hover:bg-[#E6F8F8] transition-all"
                >
                  Intentar de nuevo
                </button>
              )}
              <button
                onClick={onClose}
                className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  result?.passed
                    ? 'flex-1 bg-[#00B5B5] hover:bg-[#009999] text-white'
                    : 'px-6 border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                {result?.passed ? 'Continuar' : 'Cerrar'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
