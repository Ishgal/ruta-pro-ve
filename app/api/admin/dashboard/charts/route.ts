import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Role, ProgressStatus } from '@/app/generated/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { role: true }
    });
    if (dbUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    // Actividad diaria (últimos 7 días)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 6);

    const usersLast7Days = await prisma.user.findMany({
      where: { createdAt: { gte: sevenDaysAgo } },
      select: { createdAt: true }
    });

    const dailyMap = new Map<string, number>();
    for (let i = 0; i < 7; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      dailyMap.set(key, 0);
    }
    usersLast7Days.forEach(u => {
      const dateKey = u.createdAt!.toISOString().split('T')[0];
      if (dailyMap.has(dateKey)) dailyMap.set(dateKey, dailyMap.get(dateKey)! + 1);
    });

    const dailyActivity = Array.from(dailyMap.entries()).map(([date, count]) => ({
      date: date.slice(5),
      fullDate: date,
      count
    }));

    // Top cursos completados
    const topCompletions = await prisma.userCourseProgress.groupBy({
      by: ['courseId'],
      where: { status: ProgressStatus.completed },
      _count: { courseId: true },
      orderBy: { _count: { courseId: 'desc' } },
      take: 5
    });

    const courseIds = topCompletions.map(item => item.courseId);
    const coursesWithDetails = await prisma.course.findMany({
      where: { id: { in: courseIds } },
      include: {
        teacherAssignments: {
          where: { isActive: true },
          include: { teacher: { include: { user: { select: { name: true } } } } }
        },
        userProgress: { select: { userId: true } }
      }
    });

    const courseMap = new Map();
    coursesWithDetails.forEach(c => {
      const uniqueStudents = new Set(c.userProgress.map(p => p.userId)).size;
      const teacherName = c.teacherAssignments[0]?.teacher.user.name || 'Desconocido';
      courseMap.set(c.id, {
        title: c.title,
        instructorName: teacherName,
        studentCount: uniqueStudents,
      });
    });

    const topCourses = topCompletions.map(item => {
      const details = courseMap.get(item.courseId);
      return {
        name: details?.title || 'Curso',
        completions: item._count.courseId,
        instructor: details?.instructorName || 'Desconocido',
        students: details?.studentCount || 0,
        status: item._count.courseId > 50 ? 'Trending' : 'Popular'
      };
    });

    // Top profesores
    const teachers = await prisma.user.findMany({
      where: { role: Role.docente },
      include: {
        teacherProfile: {
          include: {
            assignments: {
              include: {
                course: {
                  include: { userProgress: { select: { userId: true } } }
                }
              }
            }
          }
        }
      }
    });

    const teacherStats = teachers.map(teacher => {
      const uniqueStudents = new Set();
      teacher.teacherProfile?.assignments.forEach(assignment => {
        assignment.course.userProgress.forEach(progress => {
          uniqueStudents.add(progress.userId);
        });
      });
      const totalCourses = teacher.teacherProfile?.assignments.length || 0;
      const rating = teacher.teacherProfile?.rating ?? 0;
      const specialty = teacher.teacherProfile?.specialty?.[0] || 'General';
      return {
        name: teacher.name || teacher.email,
        specialty,
        students: uniqueStudents.size,
        coursesCount: totalCourses,
        rating
      };
    });

    const topTeachers = teacherStats.sort((a, b) => b.students - a.students).slice(0, 2);

    // Evolución mensual (últimos 6 meses)
    const now = new Date();
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      return { year: d.getFullYear(), month: d.getMonth(), start: d };
    }).reverse();
    const userRegistrationsByMonth = await Promise.all(
      months.map(async ({ year, month, start }) => {
        const end = new Date(year, month + 1, 1);
        const count = await prisma.user.count({
          where: { createdAt: { gte: start, lt: end } }
        });
        const monthName = start.toLocaleString('default', { month: 'short' });
        return { name: `${monthName} ${year}`, value: count };
      })
    );

    return NextResponse.json({
      dailyActivity,
      topCourses,
      topTeachers,
      userRegistrations: userRegistrationsByMonth
    });
  } catch (error) {
    console.error('Error en /api/admin/dashboard/charts:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}