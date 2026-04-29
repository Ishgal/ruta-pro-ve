// app/admin/courses/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Lesson {
  id: string;
}

interface Course {
  id: string;
  title: string;
  level: { name: string };
  isPublished: boolean;
  lessons: Lesson[];
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const res = await fetch('/api/admin/courses');
      if (!res.ok) throw new Error('Error al cargar cursos');
      const data: Course[] = await res.json();
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteCourse = async (id: string) => {
    if (!confirm('¿Eliminar este curso? Se borrarán también sus lecciones.')) return;
    try {
      const res = await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Error al eliminar');
      // Recargar lista para reflejar cambio
      fetchCourses();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar el curso');
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  if (loading) return <div className="p-8 text-black">Cargando cursos...</div>;

  return (
    <div className="p-6 bg-white min-h-screen text-black">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-black">Cursos</h1>
        <Link
          href="/admin/courses/new"
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        >
          + Nuevo curso
        </Link>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-300">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-300">
              <th className="p-3 text-left text-black font-semibold">Título</th>
              <th className="p-3 text-center text-black font-semibold">Nivel</th>
              <th className="p-3 text-center text-black font-semibold">Lecciones</th>
              <th className="p-3 text-center text-black font-semibold">Publicado</th>
              <th className="p-3 text-center text-black font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((course: Course) => (
              <tr key={course.id} className="border-b border-gray-200 hover:bg-gray-50">
                <td className="p-3 font-medium text-black">{course.title}</td>
                <td className="p-3 text-center text-black">{course.level.name}</td>
                <td className="p-3 text-center text-black">{course.lessons.length}</td>
                <td className="p-3 text-center text-black">{course.isPublished ? '✅' : '❌'}</td>
                <td className="p-3 text-center space-x-3">
                  <Link
                    href={`/admin/courses/${course.id}/edit`}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Editar
                  </Link>
                  <Link
                    href={`/admin/courses/${course.id}/lessons`}
                    className="text-green-600 hover:text-green-800"
                  >
                    Lecciones
                  </Link>
                  <button
                    onClick={() => deleteCourse(course.id)}
                    className="text-red-600 hover:text-red-800 ml-2"
                  >
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}