import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'

interface RouteItem { courseId: string; title: string; order: number }

export const metadata = { title: 'Mis Cursos | Ruta Pro-VE' }

export default async function CoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const profile = await prisma.studentProfile.findUnique({
    where: { userId: user.id },
    select: { generatedRoute: true },
  })

  const routeData = profile?.generatedRoute as { route: RouteItem[] } | null
  const routeItems = (routeData?.route ?? []).sort((a, b) => a.order - b.order)
  const courseIds = routeItems.map(r => r.courseId)

  const [courses, progressList] = await Promise.all([
    prisma.course.findMany({
      where: { id: { in: courseIds } },
      include: {
        lessons: {
          orderBy: { displayOrder: 'asc' },
          select: { id: true, title: true, lessonType: true, duration: true, isFreePreview: true },
        },
      },
    }),
    prisma.userCourseProgress.findMany({
      where: { userId: user.id, courseId: { in: courseIds } },
      select: { courseId: true, status: true, progressPercent: true },
    }),
  ])

  const courseMap = new Map(courses.map(c => [c.id, c]))
  const progressMap = new Map(progressList.map(p => [p.courseId, p]))

  const orderedCourses = routeItems
    .map(item => courseMap.get(item.courseId))
    .filter((c): c is NonNullable<typeof c> => c !== undefined)

  const allCompleted = orderedCourses.length > 0 &&
    orderedCourses.every(c => progressMap.get(c.id)?.status === 'completed')

  return (
    <div className="min-h-screen bg-[#F4F6F9] px-4 py-6 md:px-8">
      <h1 className="text-xl font-bold text-gray-900 mb-0.5">Mis cursos</h1>
      <p className="text-sm text-gray-500 mb-6">Tu ruta de aprendizaje personalizada por Ruty</p>

        {orderedCourses.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">
            Completa el onboarding para ver tus cursos.
          </div>
        ) : (
          <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orderedCourses.map((course, i) => {
              const p = progressMap.get(course.id)
              const status = p?.status ?? 'not_started'
              const percent = p?.progressPercent ?? 0
              const routeIndex = i

              const isLocked = !p && routeItems.slice(0, routeIndex).some(prev => {
                const pp = progressMap.get(prev.courseId)
                return !pp || pp.status !== 'completed'
              }) && routeIndex > 0

              return (
                <div
                  key={course.id}
                  className={`bg-white rounded-2xl shadow-sm border transition-all ${
                    isLocked ? 'border-gray-100 opacity-60' : 'border-gray-100 hover:shadow-md'
                  }`}
                >
                  {/* Course header */}
                  <div className="px-5 pt-5 pb-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold ${
                        status === 'completed' ? 'bg-[#E6F8F8] text-[#00B5B5]' :
                        status === 'in_progress' ? 'bg-[#1B4F8C]/10 text-[#1B4F8C]' :
                        'bg-gray-100 text-gray-400'
                      }`}>
                        {i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{course.title}</h3>
                          <StatusBadge status={status} />
                        </div>
                        <p className="text-xs text-gray-400 mt-0.5">{course.lessons.length} lecciones</p>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {percent > 0 && (
                      <div className="mt-3 ml-12">
                        <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                          <span>Progreso</span>
                          <span>{percent}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-[#00B5B5] rounded-full" style={{ width: `${percent}%` }} />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Lessons list */}
                  {course.lessons.length > 0 && (
                    <div className="border-t border-gray-50 px-5 pb-4 pt-3">
                      <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Lecciones</p>
                      <div className="flex flex-col gap-1">
                        {course.lessons.map((lesson, li) => (
                          <div key={lesson.id} className="flex items-center gap-2.5 py-1">
                            <LessonIcon type={lesson.lessonType} />
                            <span className="flex-1 text-xs text-gray-600 truncate">{lesson.title}</span>
                            {lesson.isFreePreview && (
                              <span className="text-[10px] text-[#00B5B5] font-semibold bg-[#E6F8F8] px-1.5 py-0.5 rounded">
                                Gratis
                              </span>
                            )}
                            {lesson.duration && (
                              <span className="text-[10px] text-gray-400 flex-shrink-0">{lesson.duration}</span>
                            )}
                          </div>
                        ))}
                      </div>

                      {!isLocked && (
                        <Link
                          href={`/dashboard/courses/${course.id}`}
                          className="mt-4 flex items-center justify-center w-full py-2.5 rounded-xl bg-[#00B5B5] hover:bg-[#009999] text-white text-xs font-semibold transition-all"
                        >
                          {status === 'completed' ? 'Repasar curso' : status === 'in_progress' ? 'Continuar' : 'Comenzar curso'}
                        </Link>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Botón explorar — desbloqueado al terminar toda la ruta */}
          <div className="mt-4 w-full">
            {allCompleted ? (
              <Link
                href="/dashboard/courses/explore"
                className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl bg-[#1B4F8C] hover:bg-[#163e6e] text-white text-sm font-semibold transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                Explorar mas cursos
              </Link>
            ) : (
              <div className="flex items-center justify-center gap-2.5 w-full py-3.5 rounded-2xl border-2 border-dashed border-gray-200 text-gray-400 text-sm font-semibold cursor-not-allowed select-none">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
                </svg>
                Explorar mas cursos — completa tu ruta primero
              </div>
            )}
          </div>
          </>
        )}
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  if (status === 'completed')
    return <span className="text-[10px] font-semibold bg-green-50 text-green-600 px-2 py-0.5 rounded-full whitespace-nowrap">Completado</span>
  if (status === 'in_progress')
    return <span className="text-[10px] font-semibold bg-[#E6F8F8] text-[#007B7D] px-2 py-0.5 rounded-full whitespace-nowrap">En progreso</span>
  return <span className="text-[10px] font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full whitespace-nowrap">Por comenzar</span>
}

function LessonIcon({ type }: { type: string }) {
  if (type === 'video')
    return (
      <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.347a1.125 1.125 0 010 1.972l-11.54 6.347a1.125 1.125 0 01-1.667-.986V5.653z" />
      </svg>
    )
  if (type === 'quiz')
    return (
      <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
      </svg>
    )
  return (
    <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  )
}
