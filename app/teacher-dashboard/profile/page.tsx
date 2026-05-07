// app/teacher-dashboard/profile/page.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { User, Mail, BookOpen, Star, Calendar } from 'lucide-react';

export default async function TeacherProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: {
      teacherProfile: true,
    },
  });

  if (!dbUser || dbUser.role !== 'docente') {
    redirect('/dashboard');
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Mi Perfil</h1>
      
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-teal-600 p-8 text-white">
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-4xl font-bold">
                {dbUser.name?.charAt(0) || 'D'}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold">{dbUser.name}</h2>
              <p className="text-blue-100">Docente</p>
              <div className="flex items-center gap-2 mt-2">
                <Star className="w-4 h-4 text-yellow-400" />
                <span>{dbUser.teacherProfile?.rating?.toFixed(1) || 'Sin calificaciones'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Información */}
        <div className="p-8 space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Información Personal
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Nombre completo</label>
                <p className="text-gray-900">{dbUser.name}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Correo electrónico</label>
                <p className="text-gray-900">{dbUser.email}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Miembro desde</label>
                <p className="text-gray-900">
                  {new Date(dbUser.createdAt || new Date()).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {dbUser.teacherProfile && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-blue-600" />
                Información Profesional
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Especialidad</label>
                  <p className="text-gray-900">
                    {dbUser.teacherProfile.specialty?.join(', ') || 'No especificada'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Límite de estudiantes</label>
                  <p className="text-gray-900">{dbUser.teacherProfile.studentsLimit || 20}</p>
                </div>
                {dbUser.teacherProfile.bio && (
                  <div className="md:col-span-2">
                    <label className="text-sm text-gray-500">Biografía</label>
                    <p className="text-gray-900">{dbUser.teacherProfile.bio}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}