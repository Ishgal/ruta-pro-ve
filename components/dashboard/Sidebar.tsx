'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { logoutAction } from '@/app/actions/logout.actions'

const baseNavItems = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/courses',
    label: 'Cursos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    href: '/dashboard/profile',
    label: 'Perfil',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
  },
  {
    href: '/dashboard/payments',
    label: 'Pagos',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5z" />
      </svg>
    ),
  },
]

const messagesNavItem = {
  href: '/dashboard/messages',
  label: 'Mensajes',
  icon: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 9.75a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375m-13.5 3.01c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.184-4.183a1.14 1.14 0 01.778-.332 48.294 48.294 0 005.83-.498c1.585-.233 2.708-1.626 2.708-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
    </svg>
  ),
}

const PLAN_PILL: Record<string, { label: string; cls: string }> = {
  bronce: { label: 'Bronce', cls: 'bg-orange-50 text-orange-500' },
  plata:  { label: 'Plata',  cls: 'bg-slate-100 text-slate-500' },
  oro:    { label: 'Oro',    cls: 'bg-amber-100 text-amber-600' },
}

export default function Sidebar({ isOro = false, plan = 'bronce' }: { isOro?: boolean; plan?: string }) {
  const pathname = usePathname()
  const navItems = isOro ? [...baseNavItems, messagesNavItem] : baseNavItems
  const pill = PLAN_PILL[plan] ?? PLAN_PILL.bronce

  return (
    <aside className="hidden md:flex flex-col w-56 shrink-0 bg-white border-r border-gray-100 h-full px-4 py-6">
      {/* Logo */}
      <div className="mb-8 px-2">
        <span className="text-[#00B5B5] font-black text-xl tracking-tight">RUTA PRO</span>
      </div>

      {/* Nav items */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map(({ href, label, icon }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                isActive
                  ? 'bg-[#E6F8F8] text-[#00B5B5]'
                  : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
              }`}
            >
              <span className={isActive ? 'text-[#00B5B5]' : 'text-gray-400'}>
                {icon}
              </span>
              {label}
            </Link>
          )
        })}
      </nav>

      {/* Logout */}
      <form action={logoutAction} className="mt-auto mb-3">
        <button
          type="submit"
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-400 hover:bg-red-50 hover:text-red-500 transition-all duration-150"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Cerrar sesión
        </button>
      </form>

      {/* Upgrade card */}
      {plan === 'bronce' && (
        <Link href="/dashboard/plans" className="rounded-2xl bg-[#007B7D] px-4 py-5 text-white block hover:bg-[#006364] transition-colors">
          <p className="font-bold text-sm tracking-wide mb-1">Mejora tu plan</p>
          <p className="text-xs text-white/80 leading-snug">
            Sin anuncios, descuentos en certificados y mentoria.
          </p>
        </Link>
      )}
      {plan === 'plata' && (
        <Link href="/dashboard/plans" className="rounded-2xl bg-[#1B4F8C] px-4 py-5 text-white block hover:bg-[#163e6e] transition-colors">
          <p className="font-bold text-sm tracking-wide mb-1">Actualizar a ORO</p>
          <p className="text-xs text-white/80 leading-snug">
            Mentoria 1:1, mas cupones de certificado y acceso completo.
          </p>
        </Link>
      )}
    </aside>
  )
}
