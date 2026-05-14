// app/teacher-dashboard/courses/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import TeacherCoursesClient from './TeacherCoursesClient';
import type { ViewerLesson } from './[id]/TeacherCourseViewer';

export default async function TeacherCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  const assignments = await prisma.teacherAssignment.findMany({
    where: { teacherId: user.id, isActive: true },
    include: {
      course: {
        include: {
          level: true,
          lessons: { orderBy: { displayOrder: 'asc' } },
        },
      },
    },
  });

  const courses = assignments.map(a => ({
    id: a.course.id,
    title: a.course.title,
    description: a.course.description,
    thumbnailUrl: a.course.thumbnailUrl,
    duration: a.course.duration,
    level: a.course.level ? { name: a.course.level.name } : null,
    lessons: a.course.lessons as unknown as ViewerLesson[],
  }));

  return <TeacherCoursesClient courses={courses} />;
}
