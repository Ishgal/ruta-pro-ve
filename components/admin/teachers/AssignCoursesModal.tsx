'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Trash2, BookOpen } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  isPublished: boolean;
  level: { name: string };
}

interface AssignCoursesModalProps {
  teacherId: string;
  teacherName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignCoursesModal({ teacherId, teacherName, onClose, onSuccess }: AssignCoursesModalProps) {
  const [assignedCourses, setAssignedCourses] = useState<Course[]>([]);
  const [unassignedCourses, setUnassignedCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');

  useEffect(() => {
    fetchCourses();
  }, [teacherId]);

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}/courses`);
      const data = await res.json();
      setAssignedCourses(data.assigned || []);
      setUnassignedCourses(data.unassigned || []);
    } catch (error) {
      console.error('Error al cargar cursos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedCourseId) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: selectedCourseId })
      });
      if (res.ok) {
        await fetchCourses();
        setSelectedCourseId('');
        onSuccess();
      } else {
        const error = await res.json();
        alert(error.error || 'Error al asignar curso');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al asignar curso');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnassign = async (courseId: string) => {
    if (!confirm('¿Desasignar este curso del profesor?')) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/teachers/${teacherId}/courses?courseId=${courseId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        await fetchCourses();
        onSuccess();
      } else {
        alert('Error al desasignar curso');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error al desasignar curso');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-3xl bg-white rounded-2xl shadow-xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Asignar cursos</h2>
            <p className="text-sm text-gray-500 mt-1">
              {teacherName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Cursos asignados */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-teal-500" />
                  Cursos asignados ({assignedCourses.length})
                </h3>
                {assignedCourses.length === 0 ? (
                  <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-4 text-center">
                    No hay cursos asignados
                  </p>
                ) : (
                  <div className="space-y-2">
                    {assignedCourses.map(course => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-gray-800">{course.title}</p>
                          <p className="text-xs text-gray-400">
                            {course.level?.name || 'Sin nivel'}
                          </p>
                        </div>
                        <button
                          onClick={() => handleUnassign(course.id)}
                          disabled={submitting}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Desasignar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Cursos disponibles */}
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Plus className="w-4 h-4 text-teal-500" />
                  Cursos disponibles ({unassignedCourses.length})
                </h3>
                {unassignedCourses.length === 0 ? (
                  <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-4 text-center">
                    No hay cursos disponibles para asignar
                  </p>
                ) : (
                  <div className="flex gap-3 min-w-0">
                    <select
                      value={selectedCourseId}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                    >
                      <option value="">Seleccionar curso...</option>
                      {unassignedCourses.map(course => (
                        <option key={course.id} value={course.id}>
                          {course.title} ({course.level?.name || 'Sin nivel'})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAssign}
                      disabled={!selectedCourseId || submitting}
                      className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      Asignar
                    </button>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end p-6 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}