'use client'

import { useActionState } from 'react'
import { setPasswordAction } from '@/app/actions/set-password.actions'

export default function SetPasswordPage() {
  const [state, action, isPending] = useActionState(setPasswordAction, {})

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-6">
          <span className="text-[#00B5B5] font-black text-xl tracking-tight">RUTA PRO</span>
          <h1 className="text-xl font-bold text-gray-900 mt-4">Establece tu contraseña</h1>
          <p className="text-sm text-gray-500 mt-1">
            Crea una contraseña segura para acceder a tu cuenta.
          </p>
        </div>

        <form action={action} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Contraseña
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={8}
              placeholder="Mínimo 8 caracteres"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00B5B5]/30 focus:border-[#00B5B5] transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Confirmar contraseña
            </label>
            <input
              type="password"
              name="confirm"
              required
              placeholder="Repite tu contraseña"
              className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00B5B5]/30 focus:border-[#00B5B5] transition-all"
            />
          </div>

          {state.error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {state.error}
            </p>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="w-full bg-[#00B5B5] hover:bg-[#009999] text-white font-semibold py-2.5 rounded-xl text-sm transition-all duration-150 disabled:opacity-60 mt-2"
          >
            {isPending ? 'Guardando...' : 'Guardar contraseña'}
          </button>
        </form>
      </div>
    </div>
  )
}
