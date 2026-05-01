import { prisma } from '@/lib/prisma'

// Advances assignedStartLevel as far as the student's completed route courses allow.
// Uses a loop so a single call handles both normal progression (1 level at a time)
// and backfill (student completed multiple levels before this feature existed).
export async function checkAndAdvanceLevel(userId: string): Promise<void> {
  const profile = await prisma.studentProfile.findUnique({
    where: { userId },
    select: { assignedStartLevel: true, generatedRoute: true },
  })
  if (!profile) return

  const routeData = profile.generatedRoute as { route: { courseId: string }[] } | null
  const routeIds = routeData?.route?.map(r => r.courseId) ?? []
  if (routeIds.length === 0) return

  let currentLevel = profile.assignedStartLevel

  while (true) {
    const levelCourses = await prisma.course.findMany({
      where: { id: { in: routeIds }, levelId: currentLevel },
      select: { id: true },
    })
    if (levelCourses.length === 0) break

    const completedCount = await prisma.userCourseProgress.count({
      where: { userId, courseId: { in: levelCourses.map(c => c.id) }, status: 'completed' },
    })
    if (completedCount < levelCourses.length) break

    const nextLevel = await prisma.level.findFirst({
      where: { id: { gt: currentLevel } },
      orderBy: { id: 'asc' },
    })
    if (!nextLevel) break

    currentLevel = nextLevel.id
  }

  if (currentLevel !== profile.assignedStartLevel) {
    // Collect all newly completed levels to record in level_completion
    const completedLevelIds: number[] = []
    let l = profile.assignedStartLevel
    while (l !== currentLevel) {
      completedLevelIds.push(l)
      const next = await prisma.level.findFirst({ where: { id: { gt: l } }, orderBy: { id: 'asc' } })
      if (!next) break
      l = next.id
    }

    await prisma.$transaction([
      prisma.studentProfile.update({
        where: { userId },
        data: { assignedStartLevel: currentLevel },
      }),
      ...completedLevelIds.map(levelId =>
        prisma.levelCompletion.upsert({
          where: { userId_levelId: { userId, levelId } },
          update: { isCompleted: true, completedAt: new Date() },
          create: { userId, levelId, isCompleted: true, completedAt: new Date() },
        })
      ),
    ])
  }
}
