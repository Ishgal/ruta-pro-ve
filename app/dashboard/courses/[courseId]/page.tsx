import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import CoursePlayerClient, { type PlayerLesson } from './CoursePlayerClient'

export default async function CoursePlayerPage({
  params,
  searchParams,
}: {
  params: Promise<{ courseId: string }>
  searchParams: Promise<{ lesson?: string }>
}) {
  const { courseId } = await params
  const { lesson: activeLessonParam } = await searchParams

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { plan: true } })

  const [course, lessonProgressList, passedAttempt] = await Promise.all([
    prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: { orderBy: { displayOrder: 'asc' } },
      },
    }),
    prisma.userLessonProgress.findMany({
      where: { userId: user.id, lesson: { courseId } },
      select: { lessonId: true },
    }),
    prisma.examAttempt.findFirst({
      where: { courseId, userId: user.id, passed: true },
      select: { id: true },
    }),
  ])

  if (!course) redirect('/dashboard/courses')

  const completedSet = new Set(lessonProgressList.map(lp => lp.lessonId))

  const lessons: PlayerLesson[] = course.lessons.map(lesson => ({
    id: lesson.id,
    title: lesson.title,
    videoUrl: lesson.videoUrl ?? null,
    content: lesson.content ?? null,
    slidesUrl: lesson.slidesUrl ?? null,
    displayOrder: lesson.displayOrder,
    duration: lesson.duration ?? null,
    lessonType: lesson.lessonType as PlayerLesson['lessonType'],
    quizData: lesson.quizData ?? null,
    isCompleted: completedSet.has(lesson.id),
  }))

  const requestedLesson = activeLessonParam
    ? lessons.find(l => l.id === activeLessonParam)
    : null

  const firstIncomplete = lessons.find(l => !l.isCompleted)
  const activeLesson = requestedLesson ?? firstIncomplete ?? lessons[0]

  return (
    <CoursePlayerClient
      courseId={courseId}
      courseTitle={course.title}
      lessons={lessons}
      initialActiveLessonId={activeLesson?.id ?? ''}
      totalLessons={course.lessons.length}
      initialExamPassed={!!passedAttempt}
      userPlan={dbUser?.plan ?? 'bronce'}
    />
  )
}
