'use client';

import { useState } from 'react';
import Image from 'next/image';
import { BookOpen, Clock, ArrowLeft } from 'lucide-react';
import TeacherCourseViewer, { type ViewerLesson } from './[id]/TeacherCourseViewer';

type Course = {
  id: string;
  title: string;
  description: string | null;
  thumbnailUrl: string | null;
  duration: string | null;
  level: { name: string } | null;
  lessons: ViewerLesson[];
};

export default function TeacherCoursesClient({ courses }: { courses: Course[] }) {
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);

  return (
    /*
      Contenedor con overflow-hidden para clipar el panel fuera de pantalla.
      En mobile: altura = viewport - header(4rem) - py-8(2rem) - pb-24(6rem)
      En desktop (lg): altura = viewport - padding lg:py-8(4rem) - margen
    */
    <div className="relative overflow-hidden h-[calc(100svh-12rem)] lg:h-[calc(100svh-6rem)]">

      {/* ── PANEL LISTA DE CURSOS ── */}
      <div
        className={[
          'absolute inset-0 overflow-y-auto',
          'transition-transform duration-300 ease-in-out',
          selectedCourse ? '-translate-x-full' : 'translate-x-0',
        ].join(' ')}
      >
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Mis Cursos</h1>

        {courses.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes cursos asignados</h3>
            <p className="text-gray-500">Los administradores te asignarán cursos próximamente.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-6">
            {courses.map(course => (
              <button
                key={course.id}
                onClick={() => setSelectedCourse(course)}
                className="group bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-all duration-300 text-left w-full"
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{course.description}</p>
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
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── PANEL DETALLE DEL CURSO ── */}
      <div
        className={[
          'absolute inset-0 overflow-y-auto bg-gray-50',
          'transition-transform duration-300 ease-in-out',
          selectedCourse ? 'translate-x-0' : 'translate-x-full',
        ].join(' ')}
      >
        {selectedCourse && (
          <div className="max-w-6xl mx-auto pb-6">
            {/* Header con botón volver + título */}
            <div className="flex items-center gap-3 mb-6">
              <button
                onClick={() => setSelectedCourse(null)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white shadow-sm hover:bg-gray-100 transition-colors shrink-0"
                aria-label="Volver a mis cursos"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 uppercase tracking-wide">Mis Cursos</p>
                <h1 className="text-xl font-bold text-gray-900 truncate">{selectedCourse.title}</h1>
              </div>
            </div>

            {/* Reproductor embebido */}
            <TeacherCourseViewer
              courseTitle={selectedCourse.title}
              lessons={selectedCourse.lessons}
            />
          </div>
        )}
      </div>

    </div>
  );
}
