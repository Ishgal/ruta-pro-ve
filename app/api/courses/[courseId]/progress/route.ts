import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { checkAndAwardBadges } from '@/lib/badges'

const XP_PER_LESSON = 10

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { courseId } = await params
  const { lessonId } = await request.json()

  if (!lessonId) return NextResponse.json({ error: 'lessonId requerido' }, { status: 400 })

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, courseId },
    select: { id: true },
  })
  if (!lesson) return NextResponse.json({ error: 'Lección no encontrada' }, { status: 404 })

  await prisma.userLessonProgress.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, completedAt: new Date() },
    update: { completedAt: new Date() },
  })

  const [totalLessons, completedLessons] = await Promise.all([
    prisma.lesson.count({ where: { courseId } }),
    prisma.userLessonProgress.count({
      where: { userId: user.id, lesson: { courseId } },
    }),
  ])

  // Cap at 99 — the final 1% only unlocks when the exam is passed
  const progressPercent = Math.min(99, Math.round((completedLessons / totalLessons) * 100))
  const allLessonsComplete = completedLessons >= totalLessons

  const [, stats] = await Promise.all([
    prisma.userCourseProgress.upsert({
      where: { userId_courseId: { userId: user.id, courseId } },
      create: {
        userId: user.id,
        courseId,
        status: 'in_progress',
        progressPercent,
        currentLessonId: lessonId,
        startedAt: new Date(),
      },
      update: {
        status: 'in_progress',
        progressPercent,
        currentLessonId: lessonId,
      },
    }),
    prisma.userStats.findUnique({
      where: { userId: user.id },
      select: { totalXp: true, currentStreakDays: true, longestStreak: true, lastActivityDate: true },
    }),
  ])

  const { streak, today } = computeStreak(stats?.lastActivityDate ?? null, stats?.currentStreakDays ?? 0)
  const newXp = (stats?.totalXp ?? 0) + XP_PER_LESSON
  const newLongest = Math.max(stats?.longestStreak ?? 0, streak)

  await prisma.userStats.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      totalXp: XP_PER_LESSON,
      currentStreakDays: 1,
      longestStreak: 1,
      lastActivityDate: today,
    },
    update: {
      totalXp: newXp,
      currentStreakDays: streak,
      longestStreak: newLongest,
      lastActivityDate: today,
    },
  })

  const newBadges = await checkAndAwardBadges(user.id, {
    currentStreakDays: streak,
    totalXp: newXp,
    totalLessonsCompleted: await prisma.userLessonProgress.count({ where: { userId: user.id } }),
  }).catch(err => { console.error('[badges]', err); return [] })

  return NextResponse.json({ progressPercent, allLessonsComplete, completedLessons, totalLessons, newBadges })
}
