import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Role, PaymentStatus } from '@/app/generated/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { email: user.email! },
      select: { role: true }
    });
    if (dbUser?.role !== 'admin') {
      return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });
    }

    const now = new Date();
    const thirtyDaysAgo = new Date(now);
    thirtyDaysAgo.setDate(now.getDate() - 30);

    const firstDayCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const totalStudents = await prisma.user.count({ where: { role: Role.estudiante } });
    const totalTeachers = await prisma.user.count({ where: { role: Role.docente } });
    const totalAdmins   = await prisma.user.count({ where: { role: Role.admin } });
    const totalUsers = totalStudents + totalTeachers + totalAdmins;

    const newUsersLast30Days = await prisma.user.count({
      where: { createdAt: { gte: thirtyDaysAgo } }
    });

    const totalPublishedCourses = await prisma.course.count({ where: { isPublished: true } });

    // Ingresos del mes actual
    const currentMonthRevenue = await prisma.payment.aggregate({
      where: {
        status: PaymentStatus.paid,
        createdAt: { gte: firstDayCurrentMonth }
      },
      _sum: { amount: true }
    });
    const totalRevenue = currentMonthRevenue._sum.amount ? Number(currentMonthRevenue._sum.amount) : 0;

    // Crecimiento de usuarios
    const usersCurrentMonth = await prisma.user.count({
      where: { createdAt: { gte: firstDayCurrentMonth } }
    });
    const usersPrevMonth = await prisma.user.count({
      where: { createdAt: { gte: firstDayPrevMonth, lt: firstDayCurrentMonth } }
    });
    const userGrowthPercent = usersPrevMonth === 0
      ? (usersCurrentMonth > 0 ? 100 : 0)
      : ((usersCurrentMonth - usersPrevMonth) / usersPrevMonth) * 100;

    // Crecimiento de ingresos
    const prevMonthRevenueAgg = await prisma.payment.aggregate({
      where: {
        status: PaymentStatus.paid,
        createdAt: { gte: firstDayPrevMonth, lt: firstDayCurrentMonth }
      },
      _sum: { amount: true }
    });
    const revenuePrevMonth = prevMonthRevenueAgg._sum.amount ? Number(prevMonthRevenueAgg._sum.amount) : 0;
    const revenueGrowthPercent = revenuePrevMonth === 0
      ? (totalRevenue > 0 ? 100 : 0)
      : ((totalRevenue - revenuePrevMonth) / revenuePrevMonth) * 100;

    // --- Métricas dinámicas de servidor y ancho de banda ---
    // Uso de servidor: % de usuarios activos en últimas 24h
    const last24h = new Date();
    last24h.setDate(last24h.getDate() - 1);
    const activeUsersLast24h = await prisma.user.count({
      where: { lastSignInAt: { gte: last24h } }
    });
    const serverUsage = totalUsers > 0
      ? (activeUsersLast24h / totalUsers) * 100
      : 0;

    // Ancho de banda: % de lecciones completadas hoy vs promedio diario de la última semana
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);
    const lessonsCompletedToday = await prisma.userLessonProgress.count({
      where: { completedAt: { gte: todayStart, lte: todayEnd } }
    });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const weeklyCompletions = await prisma.userLessonProgress.groupBy({
      by: ['completedAt'],
      where: {
        completedAt: { gte: sevenDaysAgo, lt: todayStart }
      },
      _count: { completedAt: true }
    });
    const totalWeekly = weeklyCompletions.reduce((sum, day) => sum + day._count.completedAt, 0);
    const avgDaily = weeklyCompletions.length > 0 ? totalWeekly / weeklyCompletions.length : 1;

    let bandwidthUsage = 0;
    if (avgDaily > 0) {
      bandwidthUsage = Math.min(100, (lessonsCompletedToday / avgDaily) * 100);
    } else if (lessonsCompletedToday > 0) {
      bandwidthUsage = 50;
    }

    const finalServerUsage = Math.round(serverUsage);
    const finalBandwidthUsage = Math.round(bandwidthUsage);

    return NextResponse.json({
      totalUsers,
      totalStudents,
      totalTeachers,
      totalAdmins,
      newUsersLast30Days,
      totalPublishedCourses,
      totalRevenue,
      userGrowthPercent,
      revenueGrowthPercent,
      serverUsage: finalServerUsage,
      bandwidthUsage: finalBandwidthUsage
    });
  } catch (error) {
    console.error('Error en /api/admin/dashboard/stats:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}