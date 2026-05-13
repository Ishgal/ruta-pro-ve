import { NextRequest, NextResponse } from 'next/server'
import { randomUUID } from 'crypto'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { checkAndAwardBadges } from '@/lib/badges'
import { checkAndAdvanceLevel } from '@/lib/level'
import type { ExamData, ExamQuestion } from '../route'

const GROQ_URL = 'https://api.groq.com/openai/v1/chat/completions'
const GROQ_MODEL = 'llama-3.3-70b-versatile'

const XP_PER_COURSE = 100

type GradedResult = {
  questionId: string
  earnedPoints: number
  maxPoints: number
  correct: boolean
  feedback: string
}

async function callGroqGrader(prompt: string): Promise<string | null> {
  const res = await fetch(GROQ_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 200,
    }),
  })

  if (!res.ok) {
    console.error('[exam-grader] Groq', res.status)
    return null
  }

  const data = await res.json()
  return (data.choices[0]?.message?.content as string ?? '').trim()
}

function effortScore(answer: string, maxPoints: number): number {
  const words = answer.trim().split(/\s+/).filter(Boolean).length
  if (words < 5) return 0
  if (words < 20) return Math.round(maxPoints * 0.4)
  if (words < 50) return Math.round(maxPoints * 0.6)
  return Math.round(maxPoints * 0.75)
}

async function gradeWithAI(
  question: ExamQuestion,
  studentAnswer: string
): Promise<{ score: number; feedback: string }> {
  // For fill_blank: AI evaluates accepting typos and synonyms
  const rubric = question.type === 'fill_blank'
    ? `Respuesta esperada: "${question.correctAnswer}". Acepta si el concepto es correcto aunque haya errores ortograficos menores o sinonimos validos. Otorga puntaje completo si la idea es correcta.`
    : (question.rubric ?? '')

  const prompt = `Eres un profesor calificando un examen. Evalua la siguiente respuesta de estudiante.

Pregunta: ${question.question}
Criterio de evaluacion: ${rubric}
Puntaje maximo: ${question.points} puntos
Respuesta del estudiante: "${studentAnswer}"

Responde UNICAMENTE con JSON valido, sin markdown:
{"score": <numero entre 0 y ${question.points}>, "feedback": "<retroalimentacion constructiva de 1-2 oraciones>"}`

  let raw = await callGroqGrader(prompt)
  if (!raw) {
    await new Promise(r => setTimeout(r, 2000))
    raw = await callGroqGrader(prompt)
  }

  if (!raw) {
    const score = effortScore(studentAnswer, question.points)
    return {
      score,
      feedback: score > 0
        ? 'La IA no pudo evaluar en este momento. Se asigno puntaje parcial por esfuerzo.'
        : 'La IA no pudo evaluar tu respuesta. Escribe una respuesta mas detallada.',
    }
  }

  const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()
  try {
    const parsed = JSON.parse(cleaned)
    return {
      score: Math.min(question.points, Math.max(0, Number(parsed.score) || 0)),
      feedback: parsed.feedback ?? '',
    }
  } catch {
    const score = effortScore(studentAnswer, question.points)
    return { score, feedback: 'No se pudo interpretar la evaluacion. Puntaje parcial asignado.' }
  }
}

function normalizeAnswer(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, ' ')
}

// Streak logic: consecutive calendar days
function computeStreak(lastActivity: Date | null, currentStreak: number): { streak: number; today: Date } {
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  if (!lastActivity) return { streak: 1, today }

  const last = new Date(lastActivity)
  last.setUTCHours(0, 0, 0, 0)

  const diffDays = Math.round((today.getTime() - last.getTime()) / 86_400_000)

  if (diffDays === 0) return { streak: currentStreak, today: last }
  if (diffDays === 1) return { streak: currentStreak + 1, today }
  return { streak: 1, today }
}

async function awardCourseXP(userId: string) {
  const stats = await prisma.userStats.findUnique({
    where: { userId },
    select: { totalXp: true, currentStreakDays: true, longestStreak: true, lastActivityDate: true, totalCoursesCompleted: true },
  })

  const { streak, today } = computeStreak(stats?.lastActivityDate ?? null, stats?.currentStreakDays ?? 0)
  const newXp = (stats?.totalXp ?? 0) + XP_PER_COURSE
  const newLongest = Math.max(stats?.longestStreak ?? 0, streak)
  const newCompleted = (stats?.totalCoursesCompleted ?? 0) + 1

  await prisma.userStats.upsert({
    where: { userId },
    create: {
      userId,
      totalXp: XP_PER_COURSE,
      currentStreakDays: 1,
      longestStreak: 1,
      lastActivityDate: today,
      totalCoursesCompleted: 1,
    },
    update: {
      totalXp: newXp,
      currentStreakDays: streak,
      longestStreak: newLongest,
      lastActivityDate: today,
      totalCoursesCompleted: newCompleted,
    },
  })
}

// PATCH /api/courses/[courseId]/exam/[attemptId]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string; attemptId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { courseId, attemptId } = await params
  const { answers } = await request.json() as { answers: Record<string, string> }

  const attempt = await prisma.examAttempt.findFirst({
    where: { id: attemptId, userId: user.id, courseId },
  })
  if (!attempt) return NextResponse.json({ error: 'Intento no encontrado' }, { status: 404 })
  if (attempt.passed) return NextResponse.json({ error: 'Ya completado' }, { status: 400 })

  const examData = attempt.examData as unknown as ExamData
  const questions = examData.questions

  const graded: GradedResult[] = []

  for (const q of questions) {
    const studentAnswer = answers[q.id] ?? ''

    // AI grades: development, exercise, and fill_blank (handles typos/synonyms)
    if (q.type === 'development' || q.type === 'exercise' || q.type === 'fill_blank') {
      const { score, feedback } = await gradeWithAI(q, studentAnswer)
      graded.push({
        questionId: q.id,
        earnedPoints: score,
        maxPoints: q.points,
        correct: score >= q.points * 0.6,
        feedback,
      })
    } else {
      // multiple_choice, true_false — exact match (options are fixed strings)
      const correct = normalizeAnswer(studentAnswer) === normalizeAnswer(q.correctAnswer ?? '')
      graded.push({
        questionId: q.id,
        earnedPoints: correct ? q.points : 0,
        maxPoints: q.points,
        correct,
        feedback: correct ? 'Correcto.' : `Respuesta correcta: ${q.correctAnswer}`,
      })
    }
  }

  const earnedTotal = graded.reduce((sum, g) => sum + g.earnedPoints, 0)
  const scorePercent = Math.round((earnedTotal / examData.totalPoints) * 100)
  const passed = scorePercent >= examData.passingScore

  await prisma.examAttempt.update({
    where: { id: attemptId },
    data: { answers: answers as object, score: scorePercent, passed, completedAt: new Date() },
  })

  if (passed) {
    await Promise.all([
      prisma.userCourseProgress.upsert({
        where: { userId_courseId: { userId: user.id, courseId } },
        create: { userId: user.id, courseId, status: 'completed', progressPercent: 100, completedAt: new Date() },
        update: { status: 'completed', progressPercent: 100, completedAt: new Date() },
      }),
      awardCourseXP(user.id),
      // Create locked certificate — pdfUrl stays null until paid
      prisma.certificate.upsert({
        where: { userId_courseId: { userId: user.id, courseId } },
        create: { userId: user.id, courseId, qrCode: randomUUID() },
        update: {},
      }),
    ])
    // Must run after course is marked completed (depends on UserCourseProgress state)
    await checkAndAdvanceLevel(user.id)
  }

  // Fetch updated stats (awardCourseXP already ran above) for badge evaluation
  const freshStats = passed
    ? await prisma.userStats.findUnique({
        where: { userId: user.id },
        select: { totalCoursesCompleted: true, totalXp: true, currentStreakDays: true },
      })
    : null

  const newBadges = await checkAndAwardBadges(user.id, {
    ...(freshStats ? {
      totalCoursesCompleted: freshStats.totalCoursesCompleted ?? 0,
      totalXp: freshStats.totalXp ?? 0,
      currentStreakDays: freshStats.currentStreakDays ?? 0,
    } : {}),
  }).catch(err => { console.error('[badges]', err); return [] })

  return NextResponse.json({
    score: scorePercent,
    passed,
    earnedPoints: earnedTotal,
    totalPoints: examData.totalPoints,
    passingScore: examData.passingScore,
    graded,
    newBadges,
  })
}
