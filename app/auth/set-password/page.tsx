'use client';

import { Suspense, useActionState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { setPasswordAction } from '@/app/actions/set-password.actions';

const initialState = {
  error: '',
  success: false
};

function SetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  
  // Log para verificar que el token llegó
  useEffect(() => {
    console.log('🔍 [SetPasswordForm] Token desde URL:', token);
    if (!token) {
      console.error('❌ [SetPasswordForm] No se encontró token en la URL');
    } else {
      console.log('✅ [SetPasswordForm] Token encontrado:', token.substring(0, 30) + '...');
    }
  }, [token]);
  
  const [state, action, isPending] = useActionState(setPasswordAction, initialState);

  useEffect(() => {
    if (state.success) {
      console.log('✅ [SetPasswordForm] Éxito, redirigiendo al dashboard...');
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    }
  }, [state.success, router]);

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Enlace inválido</h1>
          <p className="text-gray-500 text-sm">
            El enlace de invitación no es válido o ha expirado.
          </p>
          <p className="text-xs text-gray-400 mt-4">
            Solicita un nuevo enlace al administrador de la plataforma.
          </p>
          <p className="text-xs text-gray-400 mt-2">
            Token recibido: {token ? 'presente' : 'ausente'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
        <div className="mb-6">
          <span className="text-[#00B5B5] font-black text-xl tracking-tight">RUTA PRO</span>
          <h1 className="text-xl font-bold text-gray-900 mt-4">Establece tu contraseña</h1>
          <p className="text-sm text-gray-500 mt-1">
            Crea una contraseña segura para acceder a tu cuenta de docente.
          </p>
        </div>

        {state.success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-gray-900 mb-2">¡Contraseña guardada!</h2>
            <p className="text-sm text-gray-500">
              Serás redirigido al dashboard en unos segundos...
            </p>
          </div>
        ) : (
          <form action={action} className="flex flex-col gap-4">
            <input type="hidden" name="token" value={token} />

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Contraseña</label>
              <input
                type="password"
                name="password"
                required
                minLength={6}
                placeholder="Mínimo 6 caracteres"
                className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#00B5B5]/30 focus:border-[#00B5B5] transition-all"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Confirmar contraseña</label>
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
        )}
      </div>
    </div>
  );
}

export default function SetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-sm border border-gray-100 p-8 text-center">
          <div className="w-8 h-8 border-4 border-[#00B5B5] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-gray-500 mt-4">Cargando...</p>
        </div>
      </div>
    }>
      <SetPasswordForm />
    </Suspense>
  );
}