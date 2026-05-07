// app/teacher-dashboard/students/[id]/page.tsx
import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import Image from 'next/image';
import { 
  ArrowLeft, 
  BookOpen, 
  MessageSquare, 
  Calendar, 
  Clock, 
  Award,
  TrendingUp,
  CheckCircle,
  PlayCircle
} from 'lucide-react';

// Tipos
interface CourseProgress {
  id: string;
  title: string;
  thumbnailUrl: string | null;
  progressPercent: number;
  status: string;
  startedAt: Date | null;
  completedAt: Date | null;
  lessonsCount: number;
  completedLessons: number;
}

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  isRead: boolean;
  isFromTeacher: boolean;
}

export default async function StudentDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Verificar que el usuario es docente
  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  });

  if (!dbUser || dbUser.role !== 'docente') {
    redirect('/dashboard');
  }

  // Obtener información del estudiante
  const student = await prisma.user.findUnique({
    where: { id: params.id, role: 'estudiante' },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      plan: true,
      createdAt: true,
      studentProfile: {
        select: {
          educationLevel: true,
          career: true,
          university: true,
          primaryGoal: true,
        },
      },
    },
  });

  if (!student) {
    notFound();
  }

  // Obtener cursos del docente para verificar acceso
  const teacherCourses = await prisma.teacherAssignment.findMany({
    where: {
      teacherId: user.id,
      isActive: true,
    },
    select: { courseId: true },
  });

  const courseIds = teacherCourses.map(c => c.courseId);

  if (courseIds.length === 0) {
    notFound();
  }

  // Obtener progreso del estudiante en los cursos del docente
  const studentProgress = await prisma.userCourseProgress.findMany({
    where: {
      userId: student.id,
      courseId: { in: courseIds },
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          thumbnailUrl: true,
          lessons: {
            select: { id: true },
          },
        },
      },
    },
  });

  // Contar lecciones completadas por el estudiante
  const completedLessons = await prisma.userLessonProgress.findMany({
    where: {
      userId: student.id,
      lesson: {
        courseId: { in: courseIds },
      },
    },
    select: {
      lessonId: true,
    },
  });

  const completedLessonIds = new Set(completedLessons.map(l => l.lessonId));

  // Formatear progreso de cursos
  const coursesProgress: CourseProgress[] = studentProgress.map(progress => ({
    id: progress.course.id,
    title: progress.course.title,
    thumbnailUrl: progress.course.thumbnailUrl,
    progressPercent: progress.progressPercent || 0,
    status: progress.status || 'not_started',
    startedAt: progress.startedAt,
    completedAt: progress.completedAt,
    lessonsCount: progress.course.lessons.length,
    completedLessons: progress.course.lessons.filter(lesson => 
      completedLessonIds.has(lesson.id)
    ).length,
  }));

  // Calcular estadísticas generales
  const totalProgress = coursesProgress.reduce((acc, c) => acc + c.progressPercent, 0);
  const averageProgress = coursesProgress.length > 0 
    ? Math.round(totalProgress / coursesProgress.length) 
    : 0;
  const completedCourses = coursesProgress.filter(c => c.status === 'completed').length;
  const inProgressCourses = coursesProgress.filter(c => c.status === 'in_progress').length;

  // Obtener mensajes entre el docente y este estudiante
  const messages = await prisma.teacher_messages.findMany({
    where: {
      teacher_id: user.id,
      student_id: student.id,
    },
    orderBy: {
      created_at: 'asc',
    },
  });

  const formattedMessages: Message[] = messages.map(msg => ({
    id: msg.id,
    content: msg.content,
    createdAt: msg.created_at || new Date(),
    isRead: msg.is_read || false,
    isFromTeacher: true,
  }));

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header con navegación */}
      <div className="mb-6">
        <Link
          href="/teacher-dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>
        
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-8 text-white">
            <div className="flex items-center gap-6">
              <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                {student.avatarUrl ? (
                  <Image
                    src={student.avatarUrl}
                    alt={student.name}
                    width={96}
                    height={96}
                    className="rounded-full object-cover"
                  />
                ) : (
                  <span className="text-4xl font-bold">
                    {student.name.charAt(0)}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-bold mb-1">{student.name}</h1>
                <p className="text-blue-100">{student.email}</p>
                <div className="flex items-center gap-3 mt-3">
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    Plan {student.plan.toUpperCase()}
                  </span>
                  <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
                    Miembro desde {new Date(student.createdAt || new Date()).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-6 border-b border-gray-100">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{averageProgress}%</div>
              <div className="text-sm text-gray-500">Progreso promedio</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{completedCourses}</div>
              <div className="text-sm text-gray-500">Cursos completados</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{inProgressCourses}</div>
              <div className="text-sm text-gray-500">Cursos en progreso</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{formattedMessages.length}</div>
              <div className="text-sm text-gray-500">Mensajes intercambiados</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna izquierda - Perfil y estadísticas */}
        <div className="lg:col-span-1 space-y-6">
          {/* Información académica */}
          {student.studentProfile && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Award className="w-5 h-5 text-blue-600" />
                Información Académica
              </h2>
              <div className="space-y-3">
                {student.studentProfile.educationLevel && (
                  <div>
                    <p className="text-xs text-gray-500">Nivel educativo</p>
                    <p className="text-sm text-gray-900">{student.studentProfile.educationLevel}</p>
                  </div>
                )}
                {student.studentProfile.career && (
                  <div>
                    <p className="text-xs text-gray-500">Carrera / Área</p>
                    <p className="text-sm text-gray-900">{student.studentProfile.career}</p>
                  </div>
                )}
                {student.studentProfile.university && (
                  <div>
                    <p className="text-xs text-gray-500">Institución</p>
                    <p className="text-sm text-gray-900">{student.studentProfile.university}</p>
                  </div>
                )}
                {student.studentProfile.primaryGoal && (
                  <div>
                    <p className="text-xs text-gray-500">Objetivo principal</p>
                    <p className="text-sm text-gray-900">{student.studentProfile.primaryGoal}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progreso general */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Resumen de progreso
            </h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Progreso general</span>
                  <span className="font-semibold">{averageProgress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all"
                    style={{ width: `${averageProgress}%` }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Cursos completados</span>
                  <span className="font-semibold text-green-600">{completedCourses}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Cursos en progreso</span>
                  <span className="font-semibold text-blue-600">{inProgressCourses}</span>
                </div>
                <div className="flex justify-between text-sm mt-2">
                  <span className="text-gray-600">Total cursos asignados</span>
                  <span className="font-semibold text-gray-900">{coursesProgress.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha - Cursos y mensajes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Progreso en cursos */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-600" />
              Progreso en cursos
            </h2>
            <div className="space-y-4">
              {coursesProgress.map((course) => (
                <div key={course.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-start gap-4">
                    {course.thumbnailUrl && (
                      <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                        <Image
                          src={course.thumbnailUrl}
                          alt={course.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 mb-1">{course.title}</h3>
                      <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                        <span className="flex items-center gap-1">
                          <PlayCircle className="w-3 h-3" />
                          {course.completedLessons}/{course.lessonsCount} lecciones
                        </span>
                        {course.startedAt && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Iniciado: {new Date(course.startedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full transition-all ${
                                course.progressPercent >= 70 ? 'bg-green-500' :
                                course.progressPercent >= 40 ? 'bg-blue-500' :
                                'bg-yellow-500'
                              }`}
                              style={{ width: `${course.progressPercent}%` }}
                            />
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-gray-700">
                          {course.progressPercent}%
                        </span>
                      </div>
                      {course.status === 'completed' && (
                        <div className="mt-2 flex items-center gap-1 text-green-600 text-xs">
                          <CheckCircle className="w-3 h-3" />
                          Completado el {new Date(course.completedAt || new Date()).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {coursesProgress.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay cursos asignados a este estudiante</p>
                </div>
              )}
            </div>
          </div>

          {/* Historial de mensajes */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-600" />
              Historial de mensajes
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {formattedMessages.map((message) => (
                <div
                  key={message.id}
                  className={`p-3 rounded-lg ${
                    message.isFromTeacher
                      ? 'bg-blue-50 ml-8'
                      : 'bg-gray-50 mr-8'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-sm text-gray-900">{message.content}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="w-3 h-3 text-gray-400" />
                        <span className="text-xs text-gray-400">
                          {new Date(message.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {message.isRead && (
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                </div>
              ))}
              {formattedMessages.length === 0 && (
                <div className="text-center py-8 text-gray-400">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No hay mensajes con este estudiante</p>
                </div>
              )}
            </div>
            
            {/* Botón para enviar mensaje */}
            <div className="mt-4 pt-4 border-t border-gray-100">
              <Link
                href={`/teacher-dashboard?student=${student.id}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                Enviar mensaje a {student.name.split(' ')[0]}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}