// app/teacher-dashboard/courses/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { ArrowLeft, Play, FileText, HelpCircle, Presentation } from 'lucide-react';

const lessonIcons = {
  video: Play,
  article: FileText,
  quiz: HelpCircle,
  slides: Presentation,
} as const;

type LessonType = {
  id: string;
  title: string;
  videoUrl: string | null;
  content: string | null;
  displayOrder: number;
  duration: string | null;
  isFreePreview: boolean | null;
  lessonType: 'video' | 'article' | 'quiz' | 'slides';
  quizData: JsonValue | null;
  slidesUrl: string | null;
};

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export default async function CourseDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verificar que el docente tiene acceso a este curso
  const assignment = await prisma.teacherAssignment.findFirst({
    where: {
      teacherId: user.id,
      courseId: params.id,
      isActive: true,
    },
  });

  if (!assignment) {
    notFound();
  }

  // Obtener el curso con sus lecciones
  const course = await prisma.course.findUnique({
    where: { id: params.id },
    include: {
      level: true,
      lessons: {
        orderBy: {
          displayOrder: 'asc',
        },
      },
    },
  });

  if (!course) {
    notFound();
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/teacher-dashboard/courses"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Volver a mis cursos
      </Link>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header del curso */}
        <div className="bg-linear-to-r from-blue-600 to-teal-600 p-8 text-white">
          <h1 className="text-2xl font-bold mb-2">{course.title}</h1>
          <p className="text-blue-100">{course.description}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-blue-100">
            <span>Nivel: {course.level?.name || 'No especificado'}</span>
            {course.duration && <span>Duración: {course.duration}</span>}
            <span>{course.lessons.length} lecciones</span>
          </div>
        </div>

        {/* Lista de lecciones */}
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Contenido del curso</h2>
          <div className="space-y-3">
            {(course.lessons as LessonType[]).map((lesson, index) => {
              const Icon = lessonIcons[lesson.lessonType] || FileText;
              
              return (
                <div
                  key={lesson.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-semibold text-sm">
                    {index + 1}
                  </div>
                  <Icon className="w-5 h-5 text-gray-400" />
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{lesson.title}</h3>
                    {lesson.duration && (
                      <p className="text-sm text-gray-500">Duración: {lesson.duration}</p>
                    )}
                  </div>
                  {lesson.lessonType === 'video' && lesson.videoUrl && (
                    <button className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                      Ver video
                    </button>
                  )}
                  {lesson.lessonType === 'article' && lesson.content && (
                    <button className="px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
                      Leer artículo
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}