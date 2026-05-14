// app/teacher-dashboard/courses/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import TeacherCourseViewer, { type ViewerLesson } from './TeacherCourseViewer';

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const assignment = await prisma.teacherAssignment.findFirst({
    where: { teacherId: user.id, courseId: id, isActive: true },
  });

  if (!assignment) {
    notFound();
  }

  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      level: true,
      lessons: { orderBy: { displayOrder: 'asc' } },
    },
  });

  if (!course) {
    notFound();
  }

  const lessons = course.lessons as unknown as ViewerLesson[];

  return (
    <div className="max-w-6xl mx-auto">
      <Link
        href="/teacher-dashboard/courses"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a mis cursos
      </Link>

      <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-8 text-white rounded-xl mb-5">
        <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
        <p className="text-blue-100">{course.description}</p>
        <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-blue-100">
          <span>Nivel: {course.level?.name || 'No especificado'}</span>
          <span>{lessons.length} lecciones</span>
        </div>
      </div>

      <TeacherCourseViewer courseTitle={course.title} lessons={lessons} />
    </div>
  );
}
