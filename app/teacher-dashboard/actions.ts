// app/teacher-dashboard/actions.ts
'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Tipos
interface FormattedMessage {
  id: string;
  studentId: string;
  studentName: string;
  studentAvatar: string | null;
  content: string;
  createdAt: Date;
  isRead: boolean;
}

export interface ProgressPeriodData {
  period: string;
  averageProgress: number;
  studentsCount: number;
}

async function getAuthenticatedTeacher() {
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/auth/sign-in');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, role: true }
  });

  if (!dbUser || dbUser.role !== 'docente') {
    throw new Error('Acceso no autorizado');
  }

  return dbUser;
}

export async function sendMessage(formData: FormData) {
  const teacher = await getAuthenticatedTeacher();
  const studentId = formData.get('studentId') as string;
  const content = formData.get('content') as string;

  if (!studentId || !content?.trim()) {
    throw new Error('Faltan datos del mensaje');
  }

  try {
    await prisma.teacher_messages.create({
      data: {
        teacher_id: teacher.id,
        student_id: studentId,
        content: content.trim(),
        is_read: false,
      },
    });

    revalidatePath('/teacher-dashboard');
    return { success: true };
  } catch (error) {
    console.error('Error al enviar mensaje:', error);
    throw new Error('No se pudo enviar el mensaje');
  }
}

export async function getMessages(): Promise<FormattedMessage[]> {
  const teacher = await getAuthenticatedTeacher();

  const messages = await prisma.teacher_messages.findMany({
    where: { teacher_id: teacher.id },
    orderBy: { created_at: 'desc' },
  });

  if (messages.length === 0) {
    return [];
  }

  const studentIds = [...new Set(messages.map(msg => msg.student_id))];
  
  const students = await prisma.user.findMany({
    where: {
      id: { in: studentIds },
    },
    select: {
      id: true,
      name: true,
      email: true,
      avatar_url: true,
    },
  });

  const studentMap = new Map(
    students.map(student => [student.id, student])
  );

  return messages.map(msg => {
    const student = studentMap.get(msg.student_id);
    return {
      id: msg.id,
      studentId: msg.student_id,
      studentName: student?.name || 'Estudiante',
      studentAvatar: student?.avatar_url || null,
      content: msg.content,
      createdAt: msg.created_at || new Date(),
      isRead: msg.is_read || false,
    };
  });
}

export async function markMessageAsRead(messageId: string) {
  const teacher = await getAuthenticatedTeacher();

  await prisma.teacher_messages.updateMany({
    where: {
      id: messageId,
      teacher_id: teacher.id,
    },
    data: { is_read: true },
  });

  revalidatePath('/teacher-dashboard');
  return { success: true };
}

export async function markAllMessagesAsRead() {
  const teacher = await getAuthenticatedTeacher();

  await prisma.teacher_messages.updateMany({
    where: {
      teacher_id: teacher.id,
      is_read: false,
    },
    data: { is_read: true },
  });

  revalidatePath('/teacher-dashboard');
  return { success: true };
}

export async function getProgressOverTime(courseIds?: string[]): Promise<ProgressPeriodData[]> {
  const teacher = await getAuthenticatedTeacher();
  
  let targetCourseIds = courseIds;
  if (!targetCourseIds) {
    const assignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: teacher.id,
        isActive: true,
      },
      select: { courseId: true },
    });
    targetCourseIds = assignments.map(a => a.courseId);
  }

  if (targetCourseIds.length === 0) {
    return [];
  }

  const progressData = await prisma.userCourseProgress.findMany({
    where: {
      courseId: { in: targetCourseIds },
      startedAt: { not: null },
    },
    select: {
      progressPercent: true,
      startedAt: true,
      userId: true,
    },
  });

  const now = new Date();
  const periods: { [key: string]: { totalProgress: number; count: number } } = {};
  
  for (let i = 0; i < 6; i++) {
    const date = new Date();
    date.setMonth(now.getMonth() - i);
    const periodKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    periods[periodKey] = { totalProgress: 0, count: 0 };
  }

  progressData.forEach(progress => {
    if (!progress.startedAt) return;
    
    const startDate = new Date(progress.startedAt);
    const periodKey = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}`;
    
    if (periods[periodKey]) {
      const percent = progress.progressPercent ?? 0;
      periods[periodKey].totalProgress += percent;
      periods[periodKey].count++;
    }
  });

  const result = Object.entries(periods)
    .map(([period, data]) => ({
      period,
      averageProgress: data.count > 0 ? Math.round(data.totalProgress / data.count) : 0,
      studentsCount: data.count,
    }))
    .reverse();

  return result;
}

export async function getWeeklyProgress(courseIds?: string[]): Promise<ProgressPeriodData[]> {
  const teacher = await getAuthenticatedTeacher();
  
  let targetCourseIds = courseIds;
  if (!targetCourseIds) {
    const assignments = await prisma.teacherAssignment.findMany({
      where: {
        teacherId: teacher.id,
        isActive: true,
      },
      select: { courseId: true },
    });
    targetCourseIds = assignments.map(a => a.courseId);
  }

  if (targetCourseIds.length === 0) {
    return [];
  }

  // CORREGIDO: Eliminado 'updatedAt' que no existe en el modelo
  const progressData = await prisma.userCourseProgress.findMany({
    where: {
      courseId: { in: targetCourseIds },
      startedAt: { not: null },
    },
    select: {
      progressPercent: true,
      startedAt: true,
      userId: true,
    },
  });

  const now = new Date();
  const weeks: { [key: string]: { totalProgress: number; count: number } } = {};
  
  for (let i = 0; i < 8; i++) {
    const weekKey = `Semana ${8 - i}`;
    weeks[weekKey] = { totalProgress: 0, count: 0 };
  }

  progressData.forEach(progress => {
    const startDate = progress.startedAt;
    if (!startDate) return;
    
    const weeksAgo = Math.floor((now.getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24 * 7));
    if (weeksAgo >= 0 && weeksAgo < 8) {
      const weekKey = `Semana ${8 - weeksAgo}`;
      if (weeks[weekKey]) {
        const percent = progress.progressPercent ?? 0;
        weeks[weekKey].totalProgress += percent;
        weeks[weekKey].count++;
      }
    }
  });

  const result = Object.entries(weeks)
    .map(([period, data]) => ({
      period,
      averageProgress: data.count > 0 ? Math.round(data.totalProgress / data.count) : 0,
      studentsCount: data.count,
    }))
    .reverse();

  return result;
}