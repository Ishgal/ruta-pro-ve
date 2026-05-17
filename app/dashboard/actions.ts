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

export interface AvailableTeacher {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  specialty: string[];
  rating: number;
  activeStudents: number;
  studentsLimit: number;
}

export interface PendingRating {
  teacherId: string;
  teacherName: string;
  teacherAvatar: string | null;
  courseId: string;
  courseTitle: string;
  assignmentId: string;
}

export interface MentorInfo {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  specialty: string[];
  courseId: string;
  courseTitle: string;
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

async function getCurrentCourse(studentId: string) {
  return prisma.userCourseProgress.findFirst({
    where: { userId: studentId, status: 'in_progress' },
    select: { courseId: true, course: { select: { title: true } } },
    orderBy: { startedAt: 'desc' },
  });
}

export async function getActiveMentor(): Promise<MentorInfo | null> {
  const student = await getAuthenticatedOroStudent();

  const currentCourse = await getCurrentCourse(student.id);
  if (!currentCourse) return null;

  const assignment = await prisma.mentorAssignment.findUnique({
    where: { studentId_courseId: { studentId: student.id, courseId: currentCourse.courseId } },
    select: { status: true, teacherId: true },
  });

  if (!assignment || assignment.status !== 'active') return null;

  const [teacherUser, teacherProfile] = await Promise.all([
    prisma.user.findUnique({
      where: { id: assignment.teacherId },
      select: { id: true, name: true, email: true, avatarUrl: true },
    }),
    prisma.teacher.findUnique({
      where: { id: assignment.teacherId },
      select: { specialty: true },
    }),
  ]);

  if (!teacherUser) return null;

  return {
    id: teacherUser.id,
    name: teacherUser.name,
    email: teacherUser.email,
    avatarUrl: teacherUser.avatarUrl,
    specialty: teacherProfile?.specialty ?? [],
    courseId: currentCourse.courseId,
    courseTitle: currentCourse.course.title,
  };
}

export async function getAvailableTeachersForCurrentCourse(): Promise<AvailableTeacher[]> {
  const student = await getAuthenticatedOroStudent();

  const currentCourse = await getCurrentCourse(student.id);
  if (!currentCourse) throw new Error('No tienes un curso activo');

  const teacherAssignments = await prisma.teacherAssignment.findMany({
    where: { courseId: currentCourse.courseId, isActive: true },
    select: { teacherId: true },
  });

  if (teacherAssignments.length === 0) return [];

  const teacherIds = teacherAssignments.map(a => a.teacherId);

  const [teacherUsers, teacherProfiles, activeCounts] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: teacherIds }, isActive: true },
      select: { id: true, name: true, email: true, avatarUrl: true },
    }),
    prisma.teacher.findMany({
      where: { id: { in: teacherIds } },
      select: { id: true, specialty: true, rating: true, studentsLimit: true },
    }),
    prisma.mentorAssignment.groupBy({
      by: ['teacherId'],
      where: { teacherId: { in: teacherIds }, status: 'active' },
      _count: { teacherId: true },
    }),
  ]);

  const profileMap = new Map(teacherProfiles.map(p => [p.id, p]));
  const countMap = new Map(activeCounts.map(c => [c.teacherId, c._count.teacherId]));

  return teacherUsers
    .map(u => {
      const profile = profileMap.get(u.id);
      const limit = profile?.studentsLimit ?? 20;
      const active = countMap.get(u.id) ?? 0;
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        specialty: profile?.specialty ?? [],
        rating: profile?.rating ?? 0,
        activeStudents: active,
        studentsLimit: limit,
      };
    })
    .filter(t => t.activeStudents < t.studentsLimit);
}

export async function assignMentor(teacherId: string): Promise<{ success: boolean }> {
  const student = await getAuthenticatedOroStudent();

  const currentCourse = await getCurrentCourse(student.id);
  if (!currentCourse) throw new Error('No tienes un curso activo');

  const teacherAssignment = await prisma.teacherAssignment.findFirst({
    where: { teacherId, courseId: currentCourse.courseId, isActive: true },
  });
  if (!teacherAssignment) throw new Error('Este docente no está asignado a tu curso actual');

  const profile = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { studentsLimit: true },
  });
  const limit = profile?.studentsLimit ?? 20;

  const activeCount = await prisma.mentorAssignment.count({
    where: { teacherId, status: 'active' },
  });
  if (activeCount >= limit) throw new Error('Este docente ya no tiene cupo disponible');

  await prisma.mentorAssignment.create({
    data: {
      studentId: student.id,
      teacherId,
      courseId: currentCourse.courseId,
      status: 'active',
    },
  });

  revalidatePath('/dashboard/messages');
  return { success: true };
}

export async function getTeacherMessages(courseId: string): Promise<ConversationMessage[]> {
  const student = await getAuthenticatedOroStudent();

  const messages = await prisma.teacher_messages.findMany({
    where: { student_id: student.id, course_id: courseId },
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
  const courseId = formData.get('courseId') as string;
  const content = formData.get('content') as string;

  if (!teacherId || !courseId || !content?.trim()) {
    throw new Error('Faltan datos del mensaje');
  }

  await prisma.teacher_messages.create({
    data: {
      teacher_id: teacherId,
      student_id: student.id,
      course_id: courseId,
      content: content.trim(),
      is_read: false,
      is_from_teacher: false,
    },
  });

  revalidatePath('/dashboard/messages');
  return { success: true };
}

export async function markTeacherMessagesRead(teacherId: string, courseId: string) {
  const student = await getAuthenticatedOroStudent();

  await prisma.teacher_messages.updateMany({
    where: {
      student_id: student.id,
      teacher_id: teacherId,
      course_id: courseId,
      is_from_teacher: true,
      is_read: false,
    },
    data: { is_read: true },
  });

  revalidatePath('/dashboard/messages');
  return { success: true };
}

export async function getPendingRating(): Promise<PendingRating | null> {
  const student = await getAuthenticatedOroStudent();

  // Busca asignaciones activas o completadas cuyo curso ya terminó y sin calificación
  const assignments = await prisma.mentorAssignment.findMany({
    where: {
      studentId: student.id,
      status: { in: ['active', 'completed'] },
    },
    select: {
      id: true,
      teacherId: true,
      courseId: true,
      status: true,
    },
  });

  for (const assignment of assignments) {
    const courseProgress = await prisma.userCourseProgress.findUnique({
      where: { userId_courseId: { userId: student.id, courseId: assignment.courseId } },
      select: { status: true, course: { select: { title: true } } },
    });

    if (courseProgress?.status !== 'completed') continue;

    const alreadyRated = await prisma.teacherReview.findUnique({
      where: { teacherId_studentId_courseId: { teacherId: assignment.teacherId, studentId: student.id, courseId: assignment.courseId } },
    });

    if (alreadyRated) {
      // Marcar como completada si aún está activa
      if (assignment.status === 'active') {
        await prisma.mentorAssignment.update({
          where: { id: assignment.id },
          data: { status: 'completed', completedAt: new Date() },
        });
      }
      continue;
    }

    // Curso completado sin calificación → marcar asignación como completada y retornar
    if (assignment.status === 'active') {
      await prisma.mentorAssignment.update({
        where: { id: assignment.id },
        data: { status: 'completed', completedAt: new Date() },
      });
    }

    const teacherUser = await prisma.user.findUnique({
      where: { id: assignment.teacherId },
      select: { name: true, avatarUrl: true },
    });

    return {
      assignmentId: assignment.id,
      teacherId: assignment.teacherId,
      teacherName: teacherUser?.name ?? 'Docente',
      teacherAvatar: teacherUser?.avatarUrl ?? null,
      courseId: assignment.courseId,
      courseTitle: courseProgress.course.title,
    };
  }

  return null;
}

export async function submitTeacherRating(teacherId: string, courseId: string, rating: number) {
  const student = await getAuthenticatedOroStudent();

  if (rating < 1 || rating > 5) throw new Error('Calificación inválida');

  await prisma.teacherReview.create({
    data: {
      teacherId,
      studentId: student.id,
      courseId,
      rating,
    },
  });

  // Recalcular el rating promedio del docente
  const reviews = await prisma.teacherReview.findMany({
    where: { teacherId },
    select: { rating: true },
  });
  const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  await prisma.teacher.update({
    where: { id: teacherId },
    data: { rating: avg },
  });

  revalidatePath('/dashboard/messages');
  return { success: true };
}
