'use server';

import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export interface ConversationMessage {
  id: string;
  teacherId: string;
  teacherName: string;
  teacherAvatar: string | null;
  content: string;
  createdAt: Date;
  isRead: boolean;
  isFromTeacher: boolean;
}

async function getAuthenticatedOroStudent() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect('/login');

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { id: true, plan: true, role: true },
  });

  if (!dbUser || dbUser.role !== 'estudiante') {
    throw new Error('Acceso no autorizado');
  }
  if (dbUser.plan !== 'oro') {
    throw new Error('Esta función requiere el plan Oro');
  }

  return dbUser;
}

export async function getTeacherMessages(): Promise<ConversationMessage[]> {
  const student = await getAuthenticatedOroStudent();

  const messages = await prisma.teacher_messages.findMany({
    where: { student_id: student.id },
    orderBy: { created_at: 'asc' },
  });

  if (messages.length === 0) return [];

  const teacherIds = [...new Set(messages.map(m => m.teacher_id))];
  const teachers = await prisma.user.findMany({
    where: { id: { in: teacherIds } },
    select: { id: true, name: true, avatarUrl: true },
  });
  const teacherMap = new Map(teachers.map(t => [t.id, t]));

  return messages.map(m => {
    const teacher = teacherMap.get(m.teacher_id);
    return {
      id: m.id,
      teacherId: m.teacher_id,
      teacherName: teacher?.name || 'Docente',
      teacherAvatar: teacher?.avatarUrl || null,
      content: m.content,
      createdAt: m.created_at ?? new Date(),
      isRead: m.is_read ?? false,
      isFromTeacher: m.is_from_teacher ?? true,
    };
  });
}

export async function sendMessageToTeacher(formData: FormData) {
  const student = await getAuthenticatedOroStudent();
  const teacherId = formData.get('teacherId') as string;
  const content = formData.get('content') as string;

  if (!teacherId || !content?.trim()) {
    throw new Error('Faltan datos del mensaje');
  }

  await prisma.teacher_messages.create({
    data: {
      teacher_id: teacherId,
      student_id: student.id,
      content: content.trim(),
      is_read: false,
      is_from_teacher: false,
    },
  });

  revalidatePath('/dashboard/messages');
  return { success: true };
}

export async function markTeacherMessagesRead(teacherId: string) {
  const student = await getAuthenticatedOroStudent();

  await prisma.teacher_messages.updateMany({
    where: {
      student_id: student.id,
      teacher_id: teacherId,
      is_from_teacher: true,
      is_read: false,
    },
    data: { is_read: true },
  });

  revalidatePath('/dashboard/messages');
  return { success: true };
}

export async function getAssignedTeacher() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // Find courses the student is enrolled in
  const progress = await prisma.userCourseProgress.findMany({
    where: { userId: user.id },
    select: { courseId: true },
  });
  const courseIds = progress.map(p => p.courseId);
  if (courseIds.length === 0) return null;

  // Find teacher assigned to any of those courses
  // Teacher.id == User.id (1-to-1 with same PK)
  const assignment = await prisma.teacherAssignment.findFirst({
    where: { courseId: { in: courseIds }, isActive: true },
    select: { teacherId: true },
  });

  if (!assignment) return null;

  const [teacher, teacherUser] = await Promise.all([
    prisma.teacher.findUnique({
      where: { id: assignment.teacherId },
      select: { specialty: true },
    }),
    prisma.user.findUnique({
      where: { id: assignment.teacherId },
      select: { id: true, name: true, email: true, avatarUrl: true },
    }),
  ]);

  if (!teacherUser) return null;

  return {
    id: teacherUser.id,
    name: teacherUser.name,
    email: teacherUser.email,
    avatarUrl: teacherUser.avatarUrl,
    specialty: teacher?.specialty ?? [],
  };
}
