'use client'

import { useActionState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { forgotPasswordAction } from '@/app/actions/forgot-password.actions'

interface ActionState {
  error?: string
  success?: boolean
}

const initialState: ActionState = {}

export default function ForgotPasswordForm() {
  const [state, action, isPending] = useActionState(forgotPasswordAction, initialState)
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')

  if (state.success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Revisa tu correo</h2>
        <p className="text-gray-500 text-sm mb-6">
          Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
        </p>
        <Link
          href="/login"
          className="text-[#1B4F8C] text-sm font-medium hover:underline"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1">¿Olvidaste tu contraseña?</h1>
      <p className="text-gray-500 text-sm mb-8">
        Ingresa tu correo y te enviaremos un enlace para restablecerla.
      </p>

      {(state.error || urlError) && (
        <div className="animate-slide-down mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error || urlError}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Correo Electrónico
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@ejemplo.com"
              required
              autoComplete="email"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 border border-transparent text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1B4F8C] focus:ring-2 focus:ring-[#1B4F8C]/20 transition-all duration-200"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 rounded-xl bg-[#1A3C6E] text-white font-semibold text-sm hover:bg-[#1B4F8C] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] shadow-md"
        >
          {isPending ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿Recordaste tu contraseña?{' '}
        <Link href="/login" className="text-[#1B4F8C] font-medium hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
