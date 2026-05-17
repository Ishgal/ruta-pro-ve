'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/actions/logout.actions'
import {
  LayoutDashboard,
  BookOpen,
  Users,
  GraduationCap,
  CreditCard,
  Landmark,
  Trophy,
  Settings,
  LogOut,
} from 'lucide-react'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/courses', label: 'Cursos', icon: BookOpen },
  { href: '/admin/students', label: 'Estudiantes', icon: Users },
  { href: '/admin/teachers', label: 'Docentes', icon: GraduationCap },
  { href: '/admin/payments', label: 'Pagos', icon: CreditCard },
  { href: '/admin/payment-accounts', label: 'Cuentas de Pago', icon: Landmark },
  { href: '/admin/badges', label: 'Logros', icon: Trophy },
  { href: '/admin/settings', label: 'Configuracion', icon: Settings },
]

export default function AdminSidebar({ name = '' }: { name?: string }) {
  const pathname = usePathname()
  const initial = name?.charAt(0)?.toUpperCase() || 'A'

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white shadow-xl h-screen sticky top-0">
      {/* Logo */}
      <div className="flex h-16 items-center px-6 border-b border-gray-200">
        <h1 className="text-xl font-bold bg-linear-to-r from-blue-600 to-teal-600 bg-clip-text text-transparent">
          Ruta Pro-VE
        </h1>
      </div>

      {/* Perfil */}
      <div className="border-b border-gray-200 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-r from-blue-500 to-teal-500 text-white font-bold text-sm">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{name || 'Administrador'}</p>
            <p className="text-xs text-gray-500">Admin</p>
          </div>
        </div>
      </div>

      {/* Navegacion */}
      <nav className="flex-1 space-y-1 p-4 overflow-y-auto">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-teal-50 text-[#00B5B5]'
                  : 'text-gray-600 hover:bg-teal-50 hover:text-[#00B5B5]'
              }`}
            >
              <Icon className={`h-5 w-5 shrink-0 ${isActive ? 'text-[#00B5B5]' : 'text-gray-400'}`} />
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-4">
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-150"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesion
          </button>
        </form>
      </div>
    </aside>
  )
}
