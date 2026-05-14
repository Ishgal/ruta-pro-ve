import Link from 'next/link'
import Image from 'next/image'

interface AuthSplitLayoutProps {
  children: React.ReactNode
  mode: 'register' | 'login'
}

export default function AuthSplitLayout({ children, mode }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen bg-[#F0F4F8]">
      {/* Top bar — visible only on desktop */}
      <header className="hidden md:flex items-center justify-between px-8 py-4">
        <span className="text-[#1B4F8C] font-bold text-xl tracking-tight">
          ¡Hola, Estudiante!
        </span>
        <div className="flex items-center gap-3 text-sm text-gray-600">
          {mode === 'register' ? (
            <>
              <span>¿Ya tienes cuenta?</span>
              <Link
                href="/login"
                className="border border-[#1B4F8C] text-[#1B4F8C] rounded-full px-5 py-1.5 font-medium hover:bg-[#1B4F8C] hover:text-white transition-colors duration-200"
              >
                Iniciar Sesión
              </Link>
            </>
          ) : (
            <>
              <span>¿No tienes cuenta?</span>
              <Link
                href="/register"
                className="border border-[#1B4F8C] text-[#1B4F8C] rounded-full px-5 py-1.5 font-medium hover:bg-[#1B4F8C] hover:text-white transition-colors duration-200"
              >
                Crear Cuenta
              </Link>
            </>
          )}
        </div>
      </header>

      {/* Main split layout */}
      <main className="flex min-h-[calc(100vh-64px)] md:min-h-screen md:items-center md:justify-center px-4 py-8 md:p-8">
        <div className="w-full max-w-5xl flex flex-col md:flex-row md:rounded-2xl md:overflow-hidden md:shadow-2xl">

          {/* Left panel — hidden on mobile */}
          <div className="hidden md:flex md:flex-col md:justify-between bg-[#1B4F8C] text-white p-10 md:w-[42%]">
            <div>
              <p className="font-bold text-lg mb-2">Comienza tu viaje de aprendizaje hoy mismo.</p>
              <p className="text-blue-100 text-sm leading-relaxed">
                Únete a una comunidad de más de 10,000 estudiantes que están transformando su futuro profesional.
              </p>

              <div className="mt-8 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Acceso Ilimitado</p>
                    <p className="text-blue-100 text-xs mt-0.5">Explora cientos de cursos certificados.</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Comunidad Activa</p>
                    <p className="text-blue-100 text-xs mt-0.5">Conecta con mentores y compañeros.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Ruty saludando */}
            <div className="mt-8 rounded-2xl bg-[#163F73] overflow-hidden h-48 flex items-end justify-center">
              <Image
                src="/mascot/ruty-saludando.png"
                alt="Ruty saludando"
                width={180}
                height={180}
                className="object-contain object-bottom h-full w-auto"
                priority
              />
            </div>
          </div>

          {/* Right panel — form */}
          <div className="flex-1 bg-white md:p-10 p-6 rounded-2xl md:rounded-none">
            {/* Mobile header */}
            <div className="md:hidden flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-full bg-[#1B4F8C] flex items-center justify-center mb-3">
                <svg className="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
            </div>

            {children}
          </div>
        </div>
      </main>
    </div>
  )
}
