import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import ExploreCoursesClient from './ExploreCoursesClient'

export const metadata = { title: 'Explorar Cursos | Ruta Pro-VE' }

interface RouteItem { courseId: string }

export default async function ExploreCoursesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [profile, priceSetting, paymentAccounts, allCourses, extraEnrollments] = await Promise.all([
    prisma.studentProfile.findUnique({
      where: { userId: user.id },
      select: { generatedRoute: true },
    }),
    prisma.appSetting.findUnique({ where: { key: 'course_extra_price' } }),
    prisma.paymentAccount.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, method: true, label: true, details: true },
    }),
    prisma.course.findMany({
      where: { isPublished: true },
      include: {
        level: { select: { name: true } },
        lessons: { select: { id: true } },
      },
      orderBy: [{ level: { id: 'asc' } }, { title: 'asc' }],
    }),
    prisma.extraCourseEnrollment.findMany({
      where: { userId: user.id },
      select: { courseId: true, status: true },
    }),
  ])

  const routeData = profile?.generatedRoute as { route: RouteItem[] } | null
  const routeCourseIds = new Set((routeData?.route ?? []).map(r => r.courseId))
  const enrollmentMap = new Map(extraEnrollments.map(e => [e.courseId, e.status]))

  const explorableCourses = allCourses
    .filter(c => !routeCourseIds.has(c.id))
    .map(c => ({
      id: c.id,
      title: c.title,
      description: c.description ?? '',
      levelName: c.level.name,
      lessonCount: c.lessons.length,
      duration: c.duration ?? null,
      thumbnailUrl: c.thumbnailUrl ?? null,
      enrollmentStatus: enrollmentMap.get(c.id) ?? null,
    }))

  return (
    <ExploreCoursesClient
      courses={explorableCourses}
      price={priceSetting?.value ?? '3.00'}
      paymentAccounts={paymentAccounts as { id: string; method: string; label: string; details: Record<string, string> }[]}
    />
  )
}
