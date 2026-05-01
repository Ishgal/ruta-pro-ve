import { prisma } from '@/lib/prisma'

type BadgeContext = {
  totalLessonsCompleted?: number
  totalCoursesCompleted?: number
  currentStreakDays?: number
  lastExamScore?: number
  checkRouteComplete?: boolean
}

export async function checkAndAwardBadges(
  userId: string,
  context: BadgeContext = {}
): Promise<{ name: string; icon: string }[]> {
  const [allBadges, earned] = await Promise.all([
    prisma.badge.findMany(),
    prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
  ])

  const earnedSet = new Set(earned.map(e => e.badgeId))
  const unearned = allBadges.filter(b => !earnedSet.has(b.id))
  if (unearned.length === 0) return []

  const needsStats = context.totalCoursesCompleted === undefined || context.currentStreakDays === undefined
  const needsLessons = context.totalLessonsCompleted === undefined

  const [stats, lessonCount] = await Promise.all([
    needsStats
      ? prisma.userStats.findUnique({ where: { userId }, select: { totalCoursesCompleted: true, currentStreakDays: true } })
      : Promise.resolve(null),
    needsLessons
      ? prisma.userLessonProgress.count({ where: { userId } })
      : Promise.resolve(null),
  ])

  const totalCoursesCompleted = context.totalCoursesCompleted ?? stats?.totalCoursesCompleted ?? 0
  const currentStreakDays = context.currentStreakDays ?? stats?.currentStreakDays ?? 0
  const totalLessonsCompleted = context.totalLessonsCompleted ?? lessonCount ?? 0

  let isRouteComplete = false
  if (context.checkRouteComplete) {
    const profile = await prisma.studentProfile.findUnique({
      where: { userId },
      select: { generatedRoute: true },
    })
    const routeData = profile?.generatedRoute as { route: { courseId: string }[] } | null
    const routeIds = routeData?.route?.map(r => r.courseId) ?? []
    if (routeIds.length > 0) {
      const completedCount = await prisma.userCourseProgress.count({
        where: { userId, courseId: { in: routeIds }, status: 'completed' },
      })
      isRouteComplete = completedCount === routeIds.length
    }
  }

  const toAward: typeof unearned = []
  for (const badge of unearned) {
    const val = badge.conditionValue ?? 0
    let met = false
    switch (badge.conditionType) {
      case 'first_lesson':
        met = totalLessonsCompleted >= val
        break
      case 'courses_completed':
        met = totalCoursesCompleted >= val
        break
      case 'streak_days':
        met = currentStreakDays >= val
        break
      case 'exam_score':
        met = context.lastExamScore !== undefined && context.lastExamScore >= val
        break
      case 'route_completed':
        met = isRouteComplete
        break
    }
    if (met) toAward.push(badge)
  }

  if (toAward.length > 0) {
    await prisma.userBadge.createMany({
      data: toAward.map(b => ({ userId, badgeId: b.id })),
      skipDuplicates: true,
    })
  }

  return toAward.map(b => ({ name: b.name, icon: b.iconUrl ?? '' }))
}
