import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { Role } from '@/app/generated/prisma';

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
    if (dbUser?.role !== 'admin') return NextResponse.json({ error: 'Acceso denegado' }, { status: 403 });

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: { id: true, name: true, email: true, role: true, createdAt: true }
    });

    const recentPayments = await prisma.payment.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } }
    });

    const recentLessonProgress = await prisma.userLessonProgress.findMany({
      take: 5,
      orderBy: { completedAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        lesson: { include: { course: { select: { title: true } } } }
      }
    });

    const formatted = recentLessonProgress.map(lp => ({
      userName: lp.user.name || lp.user.email,
      courseTitle: lp.lesson.course.title,
      lessonTitle: lp.lesson.title,
      completedAt: lp.completedAt
    }));

    return NextResponse.json({
      recentUsers,
      recentPayments: recentPayments.map(p => ({
        id: p.id,
        userName: p.user.name || p.user.email,
        amount: Number(p.amount),
        method: p.method,
        status: p.status,
        createdAt: p.createdAt
      })),
      recentLessonCompletions: formatted
    });
  } catch (error) {
    console.error('Error en /api/admin/dashboard/recent:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}