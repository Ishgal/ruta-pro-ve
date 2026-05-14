'use client';

import { useState, useEffect } from 'react';
import { X, BookOpen, Plus, Trash2 } from 'lucide-react';

interface Course {
  id: string;
  title: string;
  careers: string[];
  levelId: number;
  level: { name: string };
}

function sortByLevel(courses: Course[]) {
  return [...courses].sort((a, b) => a.levelId - b.levelId || a.title.localeCompare(b.title));
}

interface AssignCoursesModalProps {
  teacherId: string;
  teacherName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AssignCoursesModal({ teacherId, teacherName, onClose, onSuccess }: AssignCoursesModalProps) {
  const [assigned, setAssigned] = useState<Course[]>([]);
  const [available, setAvailable] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Snapshot inicial para calcular diff al guardar
  const [originalAssigned, setOriginalAssigned] = useState<Course[]>([]);

  useEffect(() => {
    fetch(`/api/admin/teachers/${teacherId}/courses`)
      .then(r => r.json())
      .then(data => {
        const a = data.assigned || [];
        setAssigned(a);
        setOriginalAssigned(a);
        setAvailable(sortByLevel(data.unassigned || []));
      })
      .finally(() => setLoading(false));
  }, [teacherId]);

  const handleAdd = () => {
    if (!selectedCourseId) return;
    const course = available.find(c => c.id === selectedCourseId);
    if (!course) return;
    setAssigned(prev => [...prev, course]);
    setAvailable(prev => sortByLevel(prev.filter(c => c.id !== selectedCourseId)));
    setSelectedCourseId('');
  };

  const handleRemove = (courseId: string) => {
    const course = assigned.find(c => c.id === courseId);
    if (!course) return;
    setAssigned(prev => prev.filter(c => c.id !== courseId));
    setAvailable(prev => sortByLevel([...prev, course]));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const originalIds = new Set(originalAssigned.map(c => c.id));
      const currentIds = new Set(assigned.map(c => c.id));

      const toAdd = assigned.filter(c => !originalIds.has(c.id));
      const toRemove = originalAssigned.filter(c => !currentIds.has(c.id));

      await Promise.all([
        ...toAdd.map(c =>
          fetch(`/api/admin/teachers/${teacherId}/courses`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId: c.id }),
          })
        ),
        ...toRemove.map(c =>
          fetch(`/api/admin/teachers/${teacherId}/courses?courseId=${c.id}`, {
            method: 'DELETE',
          })
        ),
      ]);

      onSuccess();
      onClose();
    } catch {
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  const hasChanges =
    assigned.length !== originalAssigned.length ||
    assigned.some(c => !originalAssigned.find(o => o.id === c.id));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-xl flex flex-col overflow-hidden" style={{ width: 'min(640px, calc(100vw - 2rem))', height: 'min(660px, 90vh)' }}>

        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Asignar cursos</h2>
            <p className="text-sm text-gray-500 mt-0.5">{teacherName}</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-hidden p-6 flex flex-col gap-6">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              <div className="flex flex-col min-h-0">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2 shrink-0">
                  <BookOpen className="w-4 h-4 text-teal-500" />
                  Cursos asignados ({assigned.length})
                </h3>
                {assigned.length === 0 ? (
                  <p className="text-sm text-gray-400 bg-gray-50 rounded-lg p-4 text-center">
                    No hay cursos asignados
                  </p>
                ) : (
                  <div className="overflow-y-auto space-y-2" style={{ maxHeight: '260px' }}>
                    {assigned.map(course => (
                      <div key={course.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-gray-800 text-sm truncate">{course.title}</p>
                          <p className="text-xs text-gray-400">
                            {course.level?.name || 'Sin nivel'}
                            {course.careers?.length > 0 && (
                              <span className="ml-1 text-gray-300">·</span>
                            )}
                            {course.careers?.length > 0 && (
                              <span className="ml-1">{course.careers.join(', ')}</span>
                            )}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRemove(course.id)}
                          className="p-2 text-red-400 hover:bg-red-50 hover:text-red-500 rounded-lg transition-colors"
                          title="Quitar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {available.length > 0 && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-teal-500" />
                    Cursos disponibles ({available.length})
                  </h3>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <select
                      value={selectedCourseId}
                      onChange={e => setSelectedCourseId(e.target.value)}
                      className="flex-1 min-w-0 px-4 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500"
                    >
                      <option value="" className="text-gray-900 bg-white">Seleccionar curso...</option>
                      {available.map(course => (
                        <option key={course.id} value={course.id} className="text-gray-900 bg-white">
                          {course.title} — {course.level?.name || 'Sin nivel'}{course.careers?.length > 0 ? ` · ${course.careers.join(', ')}` : ''}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={handleAdd}
                      disabled={!selectedCourseId}
                      className="shrink-0 px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-40"
                    >
                      Agregar
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end gap-3 p-6 border-t border-gray-100">
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className="px-6 py-2.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-xl transition-colors disabled:opacity-40"
          >
            {saving
              ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              : 'Guardar cambios'
            }
          </button>
        </div>
      </div>
    </div>
  );
}
