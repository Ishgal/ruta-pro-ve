// app/admin/courses/[id]/lessons/page.tsx
'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Lesson {
  id: string;
  title: string;
  videoUrl: string | null;
  content: string | null;
  displayOrder: number;
  duration: string | null;
  isFreePreview: boolean;
}

export default function LessonsPage() {
  const params = useParams();
  const router = useRouter();
  const courseId = params.id as string;
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  const fetchLessons = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/courses/${courseId}/lessons`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setLessons(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchLessons();
  }, [fetchLessons]);

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar esta lección?')) return;
    try {
      const res = await fetch(`/api/admin/lessons/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      fetchLessons();
    } catch (err) {
      console.error(err);
      alert('No se pudo eliminar la lección');
    }
  };

  const handleSave = async (lessonData: Omit<Lesson, 'id'> & { id?: string }) => {
    const method = editingLesson ? 'PUT' : 'POST';
    const url = editingLesson
      ? `/api/admin/lessons/${editingLesson.id}`
      : `/api/admin/courses/${courseId}/lessons`;
    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(lessonData),
      });
      if (!res.ok) throw new Error();
      setModalOpen(false);
      setEditingLesson(null);
      fetchLessons();
    } catch (err) {
      console.error(err);
      alert('Error al guardar la lección');
    }
  };

  const openModal = (lesson?: Lesson) => {
    setEditingLesson(lesson || null);
    setModalOpen(true);
  };

  if (loading) return <div className="p-8 text-black">Cargando lecciones...</div>;

  return (
    <div className="p-6 bg-white min-h-screen text-black">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-black">Lecciones del curso</h1>
          <button
            onClick={() => router.back()}
            className="text-blue-600 hover:text-blue-800 mt-1"
          >
            ← Volver a cursos
          </button>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded shadow"
        >
          + Nueva lección
        </button>
      </div>

      <div className="space-y-3">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="border border-gray-300 rounded-lg p-4 flex justify-between items-center bg-white shadow-sm hover:shadow-md transition"
          >
            <div>
              <p className="font-semibold text-black">
                {lesson.displayOrder}. {lesson.title}
                {lesson.isFreePreview && (
                  <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    Vista previa
                  </span>
                )}
              </p>
              <p className="text-sm text-gray-600">
                Duración: {lesson.duration || '—'}
              </p>
            </div>
            <div className="space-x-3">
              <button
                onClick={() => openModal(lesson)}
                className="text-blue-600 hover:text-blue-800"
              >
                Editar
              </button>
              <button
                onClick={() => handleDelete(lesson.id)}
                className="text-red-600 hover:text-red-800"
              >
                Eliminar
              </button>
            </div>
          </div>
        ))}
        {lessons.length === 0 && (
          <p className="text-gray-500">No hay lecciones aún. Crea una.</p>
        )}
      </div>

      {modalOpen && (
        <LessonModal
          initialLesson={editingLesson}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditingLesson(null);
          }}
        />
      )}
    </div>
  );
}

// Modal con estilos claros
function LessonModal({
  initialLesson,
  onSave,
  onClose,
}: {
  initialLesson: Lesson | null;
  onSave: (data: Omit<Lesson, 'id'> & { id?: string }) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: initialLesson?.title || '',
    videoUrl: initialLesson?.videoUrl ?? '',
    content: initialLesson?.content ?? '',
    displayOrder: initialLesson?.displayOrder ?? 0,
    duration: initialLesson?.duration ?? '',
    isFreePreview: initialLesson?.isFreePreview ?? false,
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({ ...form, displayOrder: Number(form.displayOrder) });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 max-w-full shadow-xl">
        <h2 className="text-xl font-bold text-black mb-4">
          {initialLesson ? 'Editar Lección' : 'Nueva Lección'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            name="title"
            placeholder="Título"
            value={form.title}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 text-black bg-white"
            required
          />
          <input
            name="videoUrl"
            placeholder="URL del video"
            value={form.videoUrl}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 text-black bg-white"
          />
          <textarea
            name="content"
            placeholder="Contenido (texto)"
            rows={3}
            value={form.content}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 text-black bg-white"
          />
          <input
            name="displayOrder"
            type="number"
            placeholder="Orden"
            value={form.displayOrder}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 text-black bg-white"
          />
          <input
            name="duration"
            placeholder="Duración (ej: 10m)"
            value={form.duration}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 text-black bg-white"
          />
          <label className="flex items-center gap-2 text-black">
            <input
              type="checkbox"
              name="isFreePreview"
              checked={form.isFreePreview}
              onChange={handleChange}
              className="text-black"
            />
            Lección gratuita (vista previa)
          </label>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
            >
              Guardar
            </button>
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-black px-3 py-1 rounded hover:bg-gray-400"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}