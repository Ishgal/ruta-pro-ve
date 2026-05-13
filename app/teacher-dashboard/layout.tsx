// app/teacher-dashboard/layout.tsx
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  MessageSquare, 
  BookOpen, 
  LogOut,
  User,
  Settings
} from 'lucide-react';
import NotificationBell from '@/components/teacher/NotificationBell';  // Ruta corregida

export default async function TeacherDashboardLayout({ 
  children 
}: { 
  children: React.ReactNode 
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) redirect('/login');

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { 
      role: true, 
      name: true,
      teacherProfile: { 
        select: { 
          specialty: true,
          rating: true 
        } 
      } 
    },
  });

  if (!dbUser || dbUser.role !== 'docente') {
    if (dbUser?.role === 'admin') redirect('/admin')
    redirect('/dashboard')
  }

  const handleSignOut = async () => {
    'use server';
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect('/login');
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100">
      {/* Sidebar para desktop */}
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-72 bg-white shadow-xl lg:block">
        <div className="flex h-full flex-col">
          {/* Logo y nombre */}
          <div className="flex h-20 items-center justify-between px-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold bg-linear-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
              Ruta Pro-VE
            </h1>
            <NotificationBell />
          </div>

          {/* Perfil del docente */}
          <div className="border-b border-gray-200 p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-r from-blue-500 to-teal-500 text-white font-bold text-lg">
                {dbUser.name?.charAt(0) || 'D'}
              </div>
              <div className="flex-1">
                <p className="font-semibold text-gray-900">{dbUser.name}</p>
                <p className="text-sm text-gray-500">Docente</p>
                {dbUser.teacherProfile?.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-yellow-500">★</span>
                    <span className="text-xs text-gray-600">{dbUser.teacherProfile.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navegación */}
          <nav className="flex-1 space-y-2 p-4">
            <Link 
              href="/teacher-dashboard" 
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition-all hover:bg-blue-50 hover:text-blue-600 group"
            >
              <LayoutDashboard className="h-5 w-5" />
              <span className="font-medium">Inicio</span>
            </Link>
            
            <Link 
              href="/teacher-dashboard/messages" 
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition-all hover:bg-blue-50 hover:text-blue-600 group relative"
            >
              <MessageSquare className="h-5 w-5" />
              <span className="font-medium">Mensajes</span>
              <span id="message-badge" className="hidden" />
            </Link>
            
            <Link 
              href="/teacher-dashboard/courses" 
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition-all hover:bg-blue-50 hover:text-blue-600 group"
            >
              <BookOpen className="h-5 w-5" />
              <span className="font-medium">Mis Cursos</span>
            </Link>
          </nav>

          {/* Footer del sidebar */}
          <div className="border-t border-gray-200 p-4 space-y-2">
            <Link 
              href="/teacher-dashboard/profile" 
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition-all hover:bg-gray-100"
            >
              <User className="h-5 w-5" />
              <span className="font-medium">Perfil</span>
            </Link>
            
            <Link 
              href="/teacher-dashboard/settings" 
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-gray-700 transition-all hover:bg-gray-100"
            >
              <Settings className="h-5 w-5" />
              <span className="font-medium">Configuración</span>
            </Link>
            
            <form action={handleSignOut}>
              <button 
                type="submit"
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-red-600 transition-all hover:bg-red-50"
              >
                <LogOut className="h-5 w-5" />
                <span className="font-medium">Cerrar Sesión</span>
              </button>
            </form>
          </div>
        </div>
      </aside>

      {/* Header móvil */}
      <header className="sticky top-0 z-40 bg-white shadow-sm lg:hidden">
        <div className="flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold bg-linear-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
            Ruta Pro-VE
          </h1>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <span className="text-sm text-gray-600">{dbUser.name}</span>
            <div className="h-8 w-8 rounded-full bg-linear-to-r from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold">
              {dbUser.name?.charAt(0) || 'D'}
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="lg:pl-72">
        <div className="container mx-auto px-4 py-8 pb-24 lg:pb-8">
          {children}
        </div>
      </main>

      {/* Bottom navigation móvil */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 lg:hidden">
        <div className="flex justify-around py-2">
          <Link 
            href="/teacher-dashboard" 
            className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 hover:text-blue-600"
          >
            <LayoutDashboard className="h-5 w-5" />
            <span className="text-xs">Inicio</span>
          </Link>
          
          <Link 
            href="/teacher-dashboard/messages" 
            className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 hover:text-blue-600 relative"
          >
            <MessageSquare className="h-5 w-5" />
            <span className="text-xs">Mensajes</span>
            <span id="mobile-message-badge" className="hidden" />
          </Link>
          
          <Link 
            href="/teacher-dashboard/courses" 
            className="flex flex-col items-center gap-1 px-4 py-2 text-gray-600 hover:text-blue-600"
          >
            <BookOpen className="h-5 w-5" />
            <span className="text-xs">Cursos</span>
          </Link>
        </div>
      </nav>
    </div>
  );
}