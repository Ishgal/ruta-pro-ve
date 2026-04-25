'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { registerAction, linkedInOAuthAction, ActionState } from '@/app/actions/auth.actions'

const initialState: ActionState = {}

export default function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const [accepted, setAccepted] = useState(false)

  return (
    <div className="animate-fade-in-up w-full max-w-md mx-auto">
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">Crear Cuenta</h1>
      <p className="text-gray-500 text-sm mb-7">Ingresa tus datos para empezar.</p>

      {state?.error && (
        <div className="animate-slide-down mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        {/* Desktop: Nombre + Apellido */}
        <div className="hidden md:grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Nombre
            </label>
            <input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="Ej. Juan"
              className="w-full px-4 py-3 rounded-lg bg-gray-100 border border-transparent text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1B4F8C] focus:ring-2 focus:ring-[#1B4F8C]/20 transition-all duration-200"
            />
          </div>
          <div>
            <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-1.5">
              Apellido
            </label>
            <input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Ej. Pérez"
              className="w-full px-4 py-3 rounded-lg bg-gray-100 border border-transparent text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1B4F8C] focus:ring-2 focus:ring-[#1B4F8C]/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* Mobile: Nombre completo */}
        <div className="md:hidden">
          <label htmlFor="fullName" className="block text-xs font-bold uppercase tracking-wider text-[#1B4F8C] mb-1.5">
            Nombre Completo
          </label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <input
              id="fullName"
              name="fullName"
              type="text"
              placeholder="Tu nombre y apellidos"
              className="w-full pl-10 pr-4 py-3.5 rounded-xl bg-gray-100 border border-transparent text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1B4F8C] focus:ring-2 focus:ring-[#1B4F8C]/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="hidden md:block text-sm font-semibold text-gray-700 mb-1.5">
            Correo Electrónico
          </label>
          <label htmlFor="email" className="md:hidden block text-xs font-bold uppercase tracking-wider text-[#1B4F8C] mb-1.5">
            Email
          </label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@ejemplo.com"
              required
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 border border-transparent text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1B4F8C] focus:ring-2 focus:ring-[#1B4F8C]/20 transition-all duration-200"
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="hidden md:block text-sm font-semibold text-gray-700 mb-1.5">
            Contraseña
          </label>
          <label htmlFor="password" className="md:hidden block text-xs font-bold uppercase tracking-wider text-[#1B4F8C] mb-1.5">
            Contraseña
          </label>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Mínimo 8 caracteres"
              required
              className="w-full pl-10 pr-12 py-3 rounded-xl bg-gray-100 border border-transparent text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1B4F8C] focus:ring-2 focus:ring-[#1B4F8C]/20 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-opacity duration-200"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>
          <p className="text-xs text-gray-400 mt-1.5">Mínimo 8 caracteres, incluye un número.</p>
        </div>

        {/* Terms */}
        <label className="flex items-center gap-3 cursor-pointer select-none">
          <button
            type="button"
            onClick={() => setAccepted(!accepted)}
            className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-200 ${
              accepted ? 'bg-[#1B4F8C] border-[#1B4F8C]' : 'border-gray-300'
            }`}
            aria-checked={accepted}
            role="checkbox"
          >
            {accepted && (
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
          <span className="text-sm text-gray-600">
            Acepto los{' '}
            <Link href="/terms" className="text-[#1B4F8C] font-semibold hover:underline">
              Términos y Condiciones
            </Link>
          </span>
        </label>

        <button
          type="submit"
          disabled={pending || !accepted}
          className="w-full py-3.5 rounded-xl bg-[#1A3C6E] text-white font-semibold text-sm hover:bg-[#1B4F8C] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] shadow-md"
        >
          {pending ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Creando cuenta...
            </span>
          ) : (
            <>
              <span className="md:hidden">Registrarme →</span>
              <span className="hidden md:inline">Crear mi Cuenta</span>
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-xs text-gray-400 font-medium uppercase tracking-wider">O regístrate con</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* LinkedIn */}
      <form action={linkedInOAuthAction}>
        <button
          type="submit"
          className="w-full py-3 rounded-xl border border-gray-200 flex items-center justify-center gap-3 text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 active:scale-[0.98]"
        >
          <svg className="w-5 h-5 text-[#0077B5]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
          </svg>
          Registrar con LinkedIn
        </button>
      </form>

      <p className="md:hidden text-center text-sm text-gray-500 mt-6">
        ¿Ya tienes cuenta?{' '}
        <Link href="/login" className="text-[#1B4F8C] font-semibold hover:underline">
          Iniciar Sesión
        </Link>
      </p>
    </div>
  )
}
