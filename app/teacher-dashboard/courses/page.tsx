// app/teacher-dashboard/courses/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock } from 'lucide-react';

export default async function TeacherCoursesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Obtener cursos asignados al docente - usando camelCase como pide Prisma
  const assignments = await prisma.teacherAssignment.findMany({
    where: {
      teacherId: user.id,  // Nota: teacherId (camelCase), no teacher_id
      isActive: true,      // Nota: isActive (camelCase), no is_active
    },
    include: {
      course: {
        include: {
          level: true,
          lessons: {
            select: { id: true },
          },
        },
      },
    },
  });

  // Extraer los cursos de los assignments
  const courses = assignments.map(assignment => assignment.course);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis Cursos</h1>
      
      {courses.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No tienes cursos asignados
          </h3>
          <p className="text-gray-500">
            Los administradores te asignarán cursos próximamente.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/teacher-dashboard/courses/${course.id}`}
              className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300"
            >
              {course.thumbnailUrl && (
                <div className="relative h-48 w-full overflow-hidden">
                  <Image
                    src={course.thumbnailUrl}
                    alt={course.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
              )}
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {course.description}
                </p>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <BookOpen className="w-4 h-4" />
                    <span>{course.lessons.length} lecciones</span>
                  </div>
                  {course.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      <span>{course.duration}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <span className="text-xs font-medium text-blue-600 group-hover:text-blue-700">
                    Ver contenido →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}