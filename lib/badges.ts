import { prisma } from '@/lib/prisma'

type BadgeContext = {
  totalLessonsCompleted?: number
  totalCoursesCompleted?: number
  currentStreakDays?: number
  totalXp?: number
  lastCompletedLevelId?: number
}

export async function checkAndAwardBadges(
  userId: string,
  context: BadgeContext = {}
): Promise<{ name: string; icon: string; description: string }[]> {
  const [allBadges, earned] = await Promise.all([
    prisma.badge.findMany(),
    prisma.userBadge.findMany({ where: { userId }, select: { badgeId: true } }),
  ])

  const earnedSet = new Set(earned.map(e => e.badgeId))
  const unearned = allBadges.filter(b => !earnedSet.has(b.id))
  if (unearned.length === 0) return []

  // Fetch stats if any context values are missing
  const needsStats = (
    context.totalCoursesCompleted === undefined ||
    context.currentStreakDays === undefined ||
    context.totalXp === undefined
  )
  const needsLessons = context.totalLessonsCompleted === undefined
  const needsLevels = unearned.some(b => b.conditionType === 'LEVEL_COMPLETION')

  const [stats, lessonCount, completedLevels] = await Promise.all([
    needsStats
      ? prisma.userStats.findUnique({
          where: { userId },
          select: { totalCoursesCompleted: true, currentStreakDays: true, totalXp: true },
        })
      : Promise.resolve(null),
    needsLessons
      ? prisma.userLessonProgress.count({ where: { userId } })
      : Promise.resolve(null),
    needsLevels
      ? prisma.levelCompletion.findMany({
          where: { userId, isCompleted: true },
          select: { levelId: true },
        })
      : Promise.resolve(null),
  ])

  const totalCoursesCompleted = context.totalCoursesCompleted ?? stats?.totalCoursesCompleted ?? 0
  const currentStreakDays    = context.currentStreakDays    ?? stats?.currentStreakDays    ?? 0
  const totalXp              = context.totalXp              ?? stats?.totalXp              ?? 0
  const totalLessonsCompleted = context.totalLessonsCompleted ?? lessonCount ?? 0
  const completedLevelIds    = new Set((completedLevels ?? []).map(l => l.levelId))

  const toAward: typeof unearned = []

  for (const badge of unearned) {
    const val = badge.conditionValue ?? 0
    let met = false

    switch (badge.conditionType) {
      case 'COURSE_COMPLETION':
        met = totalCoursesCompleted >= val
        break
      case 'LESSON_COMPLETION':
        met = totalLessonsCompleted >= val
        break
      case 'STREAK_DAYS':
        met = currentStreakDays >= val
        break
      case 'XP_TOTAL':
        met = totalXp >= val
        break
      case 'LEVEL_COMPLETION':
        met = completedLevelIds.has(val)
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

  return toAward.map(b => ({
    name: b.name,
    icon: b.iconUrl ?? '🏅',
    description: b.description ?? '',
  }))
}
