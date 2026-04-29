// app/admin/courses/new/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Level {
  id: number;
  name: string;
}

export default function NewCoursePage() {
  const router = useRouter();
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
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/levels')
      .then((res) => res.json())
      .then(setLevels)
      .catch(console.error);
  }, []);

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
    setLoading(true);
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Error al crear curso');
      router.push('/admin/courses');
    } catch (err) {
      console.error(err);
      alert('Error al guardar curso');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold text-black mb-4">Nuevo Curso</h1>
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
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Crear curso'}
          </button>
          <Link href="/admin/courses" className="bg-gray-300 text-black px-4 py-2 rounded hover:bg-gray-400">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}