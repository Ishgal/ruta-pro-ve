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
  isFromTeacher: boolean;
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

export interface AssignedStudent {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  courseId: string;
  courseTitle: string;
  lastMessage: string | null;
  lastMessageFromTeacher: boolean | null;
  lastMessageAt: Date | null;
  currentLessonTitle: string | null;
}

export async function getAssignedStudents(): Promise<AssignedStudent[]> {
  const teacher = await getAuthenticatedTeacher();

  const assignments = await prisma.mentorAssignment.findMany({
    where: { teacherId: teacher.id, status: 'active' },
    select: {
      studentId: true,
      courseId: true,
      course: { select: { title: true } },
      student: { select: { id: true, name: true, email: true, avatarUrl: true } },
    },
  });

  if (assignments.length === 0) return [];

  const studentIds = assignments.map(a => a.studentId);
  const courseIds = assignments.map(a => a.courseId);

  const [messages, courseProgresses] = await Promise.all([
    prisma.teacher_messages.findMany({
      where: {
        teacher_id: teacher.id,
        student_id: { in: studentIds },
        course_id: { in: courseIds },
      },
      orderBy: { created_at: 'desc' },
      select: { student_id: true, course_id: true, content: true, is_from_teacher: true, created_at: true },
    }),
    prisma.userCourseProgress.findMany({
      where: { userId: { in: studentIds }, courseId: { in: courseIds } },
      select: {
        userId: true,
        courseId: true,
        currentLesson: { select: { title: true } },
      },
    }),
  ]);

  const lastMsgMap = new Map<string, { content: string; isFromTeacher: boolean; createdAt: Date | null }>();
  for (const msg of messages) {
    const key = `${msg.student_id}-${msg.course_id}`;
    if (!lastMsgMap.has(key)) {
      lastMsgMap.set(key, { content: msg.content, isFromTeacher: msg.is_from_teacher ?? false, createdAt: msg.created_at });
    }
  }

  const lessonMap = new Map<string, string | null>();
  for (const cp of courseProgresses) {
    lessonMap.set(`${cp.userId}-${cp.courseId}`, cp.currentLesson?.title ?? null);
  }

  return assignments.map(a => {
    const key = `${a.studentId}-${a.courseId}`;
    const lastMsg = lastMsgMap.get(key);
    return {
      id: a.student.id,
      name: a.student.name,
      email: a.student.email,
      avatarUrl: a.student.avatarUrl,
      courseId: a.courseId,
      courseTitle: a.course.title,
      lastMessage: lastMsg?.content ?? null,
      lastMessageFromTeacher: lastMsg?.isFromTeacher ?? null,
      lastMessageAt: lastMsg?.createdAt ?? null,
      currentLessonTitle: lessonMap.get(key) ?? null,
    };
  });
}

export interface StudentForDashboard {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  progress: number;
  levelName: string;
  courseId: string;
  courseTitle: string;
}

export async function getAssignedStudentsForDashboard(): Promise<StudentForDashboard[]> {
  const teacher = await getAuthenticatedTeacher();

  const assignments = await prisma.mentorAssignment.findMany({
    where: { teacherId: teacher.id, status: 'active' },
    select: {
      studentId: true,
      courseId: true,
      student: { select: { id: true, name: true, email: true, avatarUrl: true } },
      course: {
        select: {
          title: true,
          level: { select: { description: true, name: true } },
        },
      },
    },
  });

  if (assignments.length === 0) return [];

  const studentIds = [...new Set(assignments.map(a => a.studentId))];
  const courseIds = [...new Set(assignments.map(a => a.courseId))];

  const courseProgresses = await prisma.userCourseProgress.findMany({
    where: { userId: { in: studentIds }, courseId: { in: courseIds } },
    select: { userId: true, courseId: true, progressPercent: true },
  });

  const progressMap = new Map<string, number>();
  for (const cp of courseProgresses) {
    progressMap.set(`${cp.userId}-${cp.courseId}`, cp.progressPercent ?? 0);
  }

  // Un estudiante puede aparecer en múltiples cursos — deduplicamos por id
  const seen = new Set<string>();
  const result: StudentForDashboard[] = [];

  for (const a of assignments) {
    if (seen.has(a.studentId)) continue;
    seen.add(a.studentId);
    result.push({
      id: a.student.id,
      name: a.student.name,
      email: a.student.email,
      avatarUrl: a.student.avatarUrl,
      progress: progressMap.get(`${a.studentId}-${a.courseId}`) ?? 0,
      levelName: a.course.level.description ?? a.course.level.name,
      courseId: a.courseId,
      courseTitle: a.course.title,
    });
  }

  return result;
}

export async function sendMessage(formData: FormData) {
  const teacher = await getAuthenticatedTeacher();
  const studentId = formData.get('studentId') as string;
  const courseId = formData.get('courseId') as string;
  const content = formData.get('content') as string;

  if (!studentId || !courseId || !content?.trim()) {
    throw new Error('Faltan datos del mensaje');
  }

  await prisma.teacher_messages.create({
    data: {
      teacher_id: teacher.id,
      student_id: studentId,
      course_id: courseId,
      content: content.trim(),
      is_read: false,
      is_from_teacher: true,
    },
  });

  revalidatePath('/teacher-dashboard/messages');
  return { success: true };
}

export async function getMessages(studentId: string, courseId: string): Promise<FormattedMessage[]> {
  const teacher = await getAuthenticatedTeacher();

  const [messages, student] = await Promise.all([
    prisma.teacher_messages.findMany({
      where: { teacher_id: teacher.id, student_id: studentId, course_id: courseId },
      orderBy: { created_at: 'asc' },
    }),
    prisma.user.findUnique({
      where: { id: studentId },
      select: { name: true, avatarUrl: true },
    }),
    // Marcar mensajes del estudiante como leídos al abrir la conversación
    prisma.teacher_messages.updateMany({
      where: {
        teacher_id: teacher.id,
        student_id: studentId,
        course_id: courseId,
        is_from_teacher: false,
        is_read: false,
      },
      data: { is_read: true },
    }),
  ]);

  return messages.map(msg => ({
    id: msg.id,
    studentId: msg.student_id,
    studentName: student?.name ?? 'Estudiante',
    studentAvatar: student?.avatarUrl ?? null,
    content: msg.content,
    createdAt: msg.created_at ?? new Date(),
    isRead: msg.is_read ?? false,
    isFromTeacher: msg.is_from_teacher ?? true,
  }));
}

export async function getAllRecentMessages(): Promise<FormattedMessage[]> {
  const teacher = await getAuthenticatedTeacher();

  // Solo mensajes de estudiantes no leídos
  const messages = await prisma.teacher_messages.findMany({
    where: { teacher_id: teacher.id, is_from_teacher: false, is_read: false },
    orderBy: { created_at: 'desc' },
    take: 20,
  });

  if (messages.length === 0) return [];

  const studentIds = [...new Set(messages.map(m => m.student_id).filter((id): id is string => !!id))];

  const students = await prisma.user.findMany({
    where: { id: { in: studentIds } },
    select: { id: true, name: true, avatarUrl: true },
  });

  const studentMap = new Map(students.map(s => [s.id, s]));

  return messages.map(msg => ({
    id: msg.id,
    studentId: msg.student_id,
    studentName: studentMap.get(msg.student_id)?.name ?? 'Estudiante',
    studentAvatar: studentMap.get(msg.student_id)?.avatarUrl ?? null,
    content: msg.content,
    createdAt: msg.created_at ?? new Date(),
    isRead: false,
    isFromTeacher: false,
  }));
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