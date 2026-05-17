'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/actions/logout.actions'
import {
  LayoutDashboard,
  BookOpen,
  User,
  CreditCard,
  MessageSquare,
  LogOut,
} from 'lucide-react'

const baseNavItems = [
  { href: '/dashboard', label: 'Home', icon: LayoutDashboard },
  { href: '/dashboard/courses', label: 'Cursos', icon: BookOpen },
  { href: '/dashboard/profile', label: 'Perfil', icon: User },
  { href: '/dashboard/payments', label: 'Pagos', icon: CreditCard },
]

const messagesNavItem = {
  href: '/dashboard/messages',
  label: 'Mensajes',
  icon: MessageSquare,
}

const PLAN_PILL: Record<string, { label: string; cls: string }> = {
  bronce: { label: 'Bronce', cls: 'bg-orange-50 text-orange-500' },
  plata:  { label: 'Plata',  cls: 'bg-slate-100 text-slate-500' },
  oro:    { label: 'Oro',    cls: 'bg-amber-100 text-amber-600' },
}

export default function Sidebar({
  isOro = false,
  plan = 'bronce',
  name = '',
}: {
  isOro?: boolean
  plan?: string
  name?: string
}) {
  const pathname = usePathname()
  const navItems = isOro ? [...baseNavItems, messagesNavItem] : baseNavItems
  const pill = PLAN_PILL[plan] ?? PLAN_PILL.bronce
  const initial = name?.charAt(0)?.toUpperCase() || 'E'

  return (
    <aside className="hidden md:flex flex-col w-60 shrink-0 bg-white shadow-xl h-full">
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
            <p className="font-semibold text-gray-900 text-sm truncate">{name || 'Estudiante'}</p>
            <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full mt-0.5 ${pill.cls}`}>
              {pill.label}
            </span>
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
      <div className="border-t border-gray-200 p-4 space-y-2">
        {plan === 'bronce' && (
          <Link
            href="/dashboard/plans"
            className="block rounded-xl bg-[#007B7D] px-4 py-4 text-white hover:bg-[#006364] transition-colors"
          >
            <p className="font-bold text-sm tracking-wide mb-1">Mejora tu plan</p>
            <p className="text-xs text-white/80 leading-snug">
              Sin anuncios, descuentos en certificados y mentoria.
            </p>
          </Link>
        )}
        {plan === 'plata' && (
          <Link
            href="/dashboard/plans"
            className="block rounded-xl bg-[#1B4F8C] px-4 py-4 text-white hover:bg-[#163e6e] transition-colors"
          >
            <p className="font-bold text-sm tracking-wide mb-1">Actualizar a ORO</p>
            <p className="text-xs text-white/80 leading-snug">
              Mentoria 1:1, mas cupones de certificado y acceso completo.
            </p>
          </Link>
        )}
        <form action={logoutAction}>
          <button
            type="submit"
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-all duration-150"
          >
            <LogOut className="h-5 w-5" />
            Cerrar sesión
          </button>
        </form>
      </div>
    </aside>
  )
}
