// app/admin/courses/[id]/edit/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';

interface Level {
  id: number;
  name: string;
}

interface CourseData {
  id: string;
  title: string;
  description: string | null;
  levelId: number;
  isRequired: boolean;
  duration: string | null;
  thumbnailUrl: string | null;
  skillsTags: string[];
  isPublished: boolean;
}

export default function EditCoursePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [levels, setLevels] = useState<Level[]>([]);
  const [form, setForm] = useState({
    title: '',
    description: '',
    levelId: 1,
    isRequired: true,
    duration: '',
    thumbnailUrl: '',
    skillsTags: [] as string[],
    isPublished: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;

    Promise.all([
      fetch('/api/levels').then((res) => res.json() as Promise<Level[]>),
      fetch(`/api/admin/courses/${id}`).then((res) => res.json() as Promise<CourseData>),
    ])
      .then(([levelsData, course]) => {
        setLevels(levelsData);
        setForm({
          title: course.title,
          description: course.description ?? '',
          levelId: course.levelId,
          isRequired: course.isRequired,
          duration: course.duration ?? '',
          thumbnailUrl: course.thumbnailUrl ?? '',
          skillsTags: course.skillsTags ?? [],
          isPublished: course.isPublished,
        });
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm((prev) => ({ ...prev, [name]: checked }));
    } else {
      setForm((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSkillsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value.split(',').map((t) => t.trim());
    setForm((prev) => ({ ...prev, skillsTags: tags }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/courses/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error al actualizar curso');
      router.push('/admin/courses');
    } catch (err) {
      console.error(err);
      alert('Error al guardar cambios');
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-black">Cargando...</div>;
  if (!id) return <div className="p-8 text-black">ID de curso no válido</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-black mb-4">Editar Curso</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-black font-medium mb-1">Título *</label>
          <input
            type="text"
            name="title"
            required
            value={form.title}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 text-black bg-white"
          />
        </div>
        <div>
          <label className="block text-black font-medium mb-1">Descripción</label>
          <textarea
            name="description"
            rows={4}
            value={form.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 text-black bg-white"
          />
        </div>
        <div>
          <label className="block text-black font-medium mb-1">Nivel</label>
          <select
            name="levelId"
            value={form.levelId}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 text-black bg-white"
          >
            {levels.map((level) => (
              <option key={level.id} value={level.id}>{level.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-black font-medium mb-1">Duración (ej: 2h 30m)</label>
          <input
            type="text"
            name="duration"
            value={form.duration}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 text-black bg-white"
          />
        </div>
        <div>
          <label className="block text-black font-medium mb-1">URL de miniatura</label>
          <input
            type="text"
            name="thumbnailUrl"
            value={form.thumbnailUrl}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded p-2 text-black bg-white"
          />
        </div>
        <div>
          <label className="block text-black font-medium mb-1">Habilidades (separadas por coma)</label>
          <input
            type="text"
            value={form.skillsTags.join(', ')}
            onChange={handleSkillsChange}
            className="w-full border border-gray-300 rounded p-2 text-black bg-white"
          />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-1 text-black">
            <input
              type="checkbox"
              name="isRequired"
              checked={form.isRequired}
              onChange={handleChange}
              className="text-black"
            />
            Curso obligatorio
          </label>
          <label className="flex items-center gap-1 text-black">
            <input
              type="checkbox"
              name="isPublished"
              checked={form.isPublished}
              onChange={handleChange}
              className="text-black"
            />
            Publicado
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </button>
          <Link href="/admin/courses" className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}