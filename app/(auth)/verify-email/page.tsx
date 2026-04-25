import Link from 'next/link'

export const metadata = {
  title: 'Verifica tu correo | Ruta Pro-VE',
}

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#F0F4F8] flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center animate-fade-in-up">
        <div className="w-16 h-16 rounded-full bg-[#E8F0FB] flex items-center justify-center mx-auto mb-5">
          <svg className="w-8 h-8 text-[#1B4F8C]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Revisa tu correo</h1>
        <p className="text-gray-500 text-sm leading-relaxed mb-6">
          Te enviamos un enlace de verificación. Haz clic en él para activar tu cuenta y comenzar tu camino en Ruta Pro-VE.
        </p>

        <p className="text-xs text-gray-400 mb-6">
          Si no lo encuentras, revisa tu carpeta de spam.
        </p>

        <Link
          href="/login"
          className="inline-block text-sm text-[#1B4F8C] font-semibold hover:underline"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    </div>
  )
}
