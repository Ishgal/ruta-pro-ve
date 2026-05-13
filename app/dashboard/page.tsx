import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import LearningPath, { type PathCourse } from '@/components/dashboard/LearningPath'

interface RouteItem { courseId: string; title: string; order: number }

export const metadata = { title: 'Mi Ruta | Ruta Pro-VE' }

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [dbUser, rawStats, progressList] = await Promise.all([
    prisma.user.findUnique({
      where: { id: user.id },
      select: {
        name: true,
        plan: true,
        studentProfile: { select: { generatedRoute: true } },
      },
    }),
    prisma.userStats.findUnique({
      where: { userId: user.id },
      select: { totalXp: true, currentStreakDays: true, lastActivityDate: true },
    }),
    prisma.userCourseProgress.findMany({
      where: { userId: user.id },
      select: { courseId: true, status: true, progressPercent: true },
    }),
  ])

  if (!dbUser) redirect('/login')

  // Backfill: ensure UserStats exists
  let stats = rawStats
  if (!stats) {
    const [completedCourses, completedLessons] = await Promise.all([
      prisma.userCourseProgress.count({ where: { userId: user.id, status: 'completed' } }),
      prisma.userLessonProgress.count({ where: { userId: user.id } }),
    ])
    const xp = completedCourses * 100 + completedLessons * 10
    stats = await prisma.userStats.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        totalXp: xp,
        currentStreakDays: 0,
        longestStreak: 0,
        totalCoursesCompleted: completedCourses,
      },
      update: {},
      select: { totalXp: true, currentStreakDays: true, lastActivityDate: true },
    })
  }

  // Compute effective streak display (Duolingo-style)
  const streakStatus = (() => {
    if (!stats?.lastActivityDate || !stats.currentStreakDays) return 'new' as const
    const today = new Date(); today.setUTCHours(0, 0, 0, 0)
    const last = new Date(stats.lastActivityDate); last.setUTCHours(0, 0, 0, 0)
    const diff = Math.round((today.getTime() - last.getTime()) / 86_400_000)
    if (diff === 0) return 'active' as const
    if (diff === 1) return 'frozen' as const
    return 'broken' as const
  })()
  const displayStreak = streakStatus === 'broken' ? 0 : (stats?.currentStreakDays ?? 0)

  const isOro = dbUser.plan === 'oro'
  const firstName = dbUser.name.split(' ')[0]
  const routeData = dbUser.studentProfile?.generatedRoute as { route: RouteItem[] } | null
  const routeItems = (routeData?.route ?? []).sort((a, b) => a.order - b.order)

  const progressMap = new Map(progressList.map(p => [p.courseId, p]))

  const courses: PathCourse[] = routeItems.map((item, i) => {
    const p = progressMap.get(item.courseId)

    let status: PathCourse['status']
    if (p?.status === 'completed') {
      status = 'completed'
    } else if (p?.status === 'in_progress' || p?.status === 'not_started') {
      status = 'current'
    } else {
      // No progress record — unlock first course or if all previous are completed
      const allPreviousCompleted = routeItems.slice(0, i).every(prev => {
        const pp = progressMap.get(prev.courseId)
        return pp?.status === 'completed'
      })
      status = allPreviousCompleted ? 'current' : 'locked'
    }

    return {
      courseId: item.courseId,
      title: item.title,
      order: item.order,
      status,
      progressPercent: p?.progressPercent ?? 0,
    }
  })

  const completedCount = courses.filter(c => c.status === 'completed').length
  const currentCourse = courses.find(c => c.status === 'current')

  return (
    <div className="min-h-screen bg-[#F4F6F9]">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-5 py-5 md:px-8">
        <div className="flex items-start justify-between w-full">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Hola, {firstName}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {currentCourse
                ? `Continua con "${currentCourse.title}"`
                : completedCount === courses.length && courses.length > 0
                  ? 'Completaste toda tu ruta. Excelente trabajo.'
                  : 'Tu ruta de aprendizaje esta lista.'}
            </p>
          </div>

          {/* Stats pills + mentoring */}
          <div className="flex gap-3 items-center">
            {isOro && (
              <button
                disabled
                title="Proximamente"
                className="flex items-center gap-1.5 bg-yellow-50 border border-yellow-200 text-yellow-700 px-3 py-2 rounded-xl text-xs font-semibold opacity-80 cursor-not-allowed"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10l4.553-2.069A1 1 0 0121 8.82v6.36a1 1 0 01-1.447.894L15 14M3 8a2 2 0 012-2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2V8z" />
                </svg>
                Mentoria
              </button>
            )}
            <div className="flex items-center gap-1.5 bg-[#E6F8F8] px-3 py-2 rounded-xl">
              <svg className="w-4 h-4 text-[#00B5B5]" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" />
              </svg>
              <span className="text-sm font-bold text-[#007B7D]">{stats?.totalXp ?? 0} XP</span>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-2 rounded-xl ${streakStatus === 'active' ? 'bg-orange-50' : 'bg-gray-100'}`}>
              <span className="text-base">{streakStatus === 'active' ? '🔥' : streakStatus === 'frozen' ? '🧊' : '🔥'}</span>
              <span className={`text-sm font-bold ${streakStatus === 'active' ? 'text-orange-600' : 'text-gray-400'}`}>{displayStreak}</span>
            </div>
          </div>
        </div>

        {/* Progress summary */}
        {courses.length > 0 && (
          <div className="mt-4 w-full">
            <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
              <span>{completedCount} de {courses.length} cursos completados</span>
              <span>{Math.round((completedCount / courses.length) * 100)}%</span>
            </div>
            <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#00B5B5] rounded-full transition-all duration-500"
                style={{ width: `${(completedCount / courses.length) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Path */}
      {courses.length > 0 ? (
        <LearningPath courses={courses} />
      ) : (
        <div className="flex flex-col items-center justify-center py-24 text-center px-6">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 6.75V15m6-6v8.25m.503 3.498l4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 00-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0z" />
            </svg>
          </div>
          <p className="text-gray-500 text-sm font-medium">Tu ruta se esta preparando</p>
          <p className="text-gray-400 text-xs mt-1">Completa el onboarding para ver tu ruta personalizada.</p>
        </div>
      )}
    </div>
  )
}
