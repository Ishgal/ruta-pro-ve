import DashboardHeader from '@/components/dashboard/DashboardHeader'
import { logoutAction } from '@/app/actions/logout.actions'

export const metadata = { title: 'Perfil | Ruta Pro-VE' }

/* ── Mock data ─────────────────────────────────────────────────────────────── */
const user = {
  name: 'Alejandra Valdivia',
  email: 'alejandra@universidad.edu',
  title: 'Estudiante Senior',
  location: 'Ciudad de México, MX',
  memberSince: '2023',
  points: 2450,
  streak: 45,
  coursesCompleted: 12,
  level: 8,
  levelName: 'Masterminé',
  isPremium: false,
}

const badges = [
  { id: 1, label: 'Veloz', locked: false, color: 'bg-yellow-400', icon: '⚡' },
  { id: 2, label: 'Lectura', locked: false, color: 'bg-blue-500', icon: '📖' },
  { id: 3, label: 'Estrella', locked: false, color: 'bg-purple-500', icon: '⭐' },
  { id: 4, label: 'Maestro', locked: true, color: 'bg-gray-300', icon: '🔒' },
  { id: 5, label: 'Mentor', locked: true, color: 'bg-gray-300', icon: '🔒' },
  { id: 6, label: 'Social', locked: true, color: 'bg-gray-300', icon: '🔒' },
]

const certificates = [
  {
    id: 1,
    title: 'Fundamentos de UX Design',
    date: 'Noviembre 2023',
    id_code: 'UX-99283-VAL',
    bgColor: 'bg-teal-600',
    icon: '🎨',
  },
  {
    id: 2,
    title: 'Python para Ciencia de Datos',
    date: 'Agosto 2023',
    id_code: 'PD-11029-VAL',
    bgColor: 'bg-gray-800',
    icon: '🐍',
  },
]

/* ── Components ─────────────────────────────────────────────────────────────── */

function ProfileCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
      {/* Desktop layout */}
      <div className="hidden md:flex items-center gap-6 p-6 relative">
        {/* Avatar */}
        <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-100 shrink-0">
          <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-900 flex items-center justify-center">
            <svg className="w-14 h-14 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <span className="text-xs font-bold tracking-widest text-[#00B5B5] uppercase mb-1 block">
            {user.title}
          </span>
          <h1 className="text-2xl font-black text-gray-900 mb-2">{user.name}</h1>
          <div className="flex flex-wrap gap-4 text-sm text-gray-500">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {user.location}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Miembro desde {user.memberSince}
            </span>
          </div>
        </div>

        {/* Silhouette decorative */}
        <div className="hidden lg:flex w-28 h-28 items-end justify-center opacity-10 shrink-0">
          <svg viewBox="0 0 80 100" className="w-full h-full fill-gray-400">
            <ellipse cx="40" cy="28" rx="18" ry="18" />
            <path d="M10 100 Q10 60 40 55 Q70 60 70 100 Z" />
          </svg>
        </div>

        {/* Edit button */}
        <button className="shrink-0 px-5 py-2.5 rounded-xl bg-[#1B4F8C] text-white text-sm font-semibold hover:bg-[#1A3C6E] transition-colors duration-150 shadow-sm">
          Editar Perfil
        </button>
      </div>

      {/* Mobile layout */}
      <div className="md:hidden flex flex-col items-center py-8 px-6 gap-3">
        {/* Avatar with premium badge */}
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-600 to-slate-900 flex items-center justify-center">
            <svg className="w-10 h-10 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          </div>
          {user.isPremium && (
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-[#00B5B5] text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-wider">
              PREMIUM
            </span>
          )}
        </div>

        <div className="text-center">
          <h1 className="text-xl font-black text-gray-900">{user.name}</h1>
          <p className="text-sm text-gray-400 mt-0.5">{user.email}</p>
        </div>

        {/* Points + Streak inline */}
        <div className="flex gap-px overflow-hidden rounded-xl border border-gray-100 w-full mt-1">
          <div className="flex-1 py-3 text-center bg-gray-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Puntos</p>
            <p className="text-lg font-black text-gray-900">{user.points.toLocaleString()}</p>
          </div>
          <div className="flex-1 py-3 text-center bg-gray-50">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Racha</p>
            <p className="text-lg font-black text-gray-900">{user.streak} Días</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function StatsRow() {
  return (
    <div className="hidden md:grid grid-cols-3 gap-4">
      {/* Streak card — blue gradient */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-[#4B9BFB] to-[#1A5FD4] text-white p-5 shadow-sm">
        {/* Decorative waves */}
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-10">
          <svg viewBox="0 0 300 60" className="w-full h-full" preserveAspectRatio="none">
            <path d="M0 30 Q75 0 150 30 Q225 60 300 30 L300 60 L0 60 Z" fill="white" />
            <path d="M0 40 Q75 10 150 40 Q225 70 300 40 L300 60 L0 60 Z" fill="white" opacity="0.5" />
          </svg>
        </div>
        <p className="font-bold text-sm mb-1">Racha de Aprendizaje</p>
        <p className="text-white/70 text-xs mb-4">Has mantenido tu ritmo por {user.streak} días consecutivos.</p>
        <p className="text-5xl font-black">{user.streak}<span className="text-xl font-semibold ml-2">días</span></p>
      </div>

      {/* Courses completed */}
      <div className="rounded-2xl bg-white p-5 flex flex-col items-center justify-center gap-2 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[#E6F8F8] flex items-center justify-center">
          <svg className="w-6 h-6 text-[#00B5B5]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <p className="text-4xl font-black text-gray-900">{user.coursesCompleted}</p>
        <p className="text-sm text-gray-500 text-center">Cursos Completados</p>
      </div>

      {/* Level */}
      <div className="rounded-2xl bg-white p-5 flex flex-col items-center justify-center gap-2 shadow-sm">
        <div className="w-12 h-12 rounded-full bg-[#E6F8F8] flex items-center justify-center">
          <svg className="w-6 h-6 text-[#00B5B5]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
          </svg>
        </div>
        <p className="text-4xl font-black text-gray-900">Nivel {user.level}</p>
        <p className="text-sm text-gray-500">{user.levelName}</p>
      </div>
    </div>
  )
}

function UpgradeCard() {
  return (
    <div className="md:hidden rounded-2xl bg-gradient-to-br from-[#1B6EF5] to-[#0A4BCC] text-white p-5">
      <p className="font-black text-base uppercase tracking-wide mb-1">Desbloquea el Mapa Completo</p>
      <p className="text-white/75 text-xs leading-relaxed mb-4">
        Acceso a certificados oficiales, mentoría 1:1 y contenido exclusivo sin límites.
      </p>
      <button className="w-full py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm transition-colors duration-150">
        Actualizar a Premium 🚀
      </button>
    </div>
  )
}

function BadgesSection() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">
          <span className="md:hidden">Mis Medallas</span>
          <span className="hidden md:inline">Insignias Logradas</span>
        </h2>
        <button className="text-sm text-[#00B5B5] font-semibold hover:underline">Ver todos</button>
      </div>

      {/* Desktop: 4 badges in a row */}
      <div className="hidden md:flex gap-5">
        {badges.slice(0, 4).map((badge) => (
          <div key={badge.id} className="flex flex-col items-center gap-2">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${badge.locked ? 'bg-gray-100' : badge.color}`}>
              {badge.locked ? (
                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                badge.icon
              )}
            </div>
            <span className={`text-[11px] font-semibold uppercase tracking-wider ${badge.locked ? 'text-gray-400' : 'text-gray-600'}`}>
              {badge.label}
            </span>
          </div>
        ))}
      </div>

      {/* Mobile: 3-column grid, all 6 badges */}
      <div className="md:hidden grid grid-cols-3 gap-4">
        {badges.map((badge) => (
          <div key={badge.id} className="flex flex-col items-center gap-1.5">
            <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl ${badge.locked ? 'bg-gray-100' : badge.color}`}>
              {badge.locked ? (
                <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              ) : (
                badge.icon
              )}
            </div>
            <span className={`text-[10px] font-semibold uppercase tracking-wider text-center ${badge.locked ? 'text-gray-300' : 'text-gray-500'}`}>
              {badge.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function CertificatesSection() {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-bold text-gray-900">
          <span className="md:hidden">Certificados Obtenidos</span>
          <span className="hidden md:inline">Certificados Recientes</span>
        </h2>
        <button className="hidden md:block text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-3 py-1.5 rounded-lg transition-colors duration-150">
          Compartir Logros
        </button>
      </div>

      <div className="flex flex-col gap-3">
        {certificates.map((cert) => (
          <div key={cert.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors duration-150">
            {/* Thumbnail */}
            <div className={`w-16 h-12 rounded-lg ${cert.bgColor} flex items-center justify-center text-2xl shrink-0`}>
              {cert.icon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{cert.title}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                <span className="md:hidden">Finalizado </span>
                <span className="hidden md:inline">Emitido en </span>
                {cert.date}
              </p>
              <div className="hidden md:flex items-center gap-2 mt-1">
                <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  Verificado
                </span>
                <span className="text-xs text-gray-400">ID: {cert.id_code}</span>
              </div>
            </div>

            {/* Action */}
            <div>
              {/* Desktop: download icon */}
              <button className="hidden md:flex w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 items-center justify-center transition-colors duration-150" aria-label="Descargar">
                <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
              </button>
              {/* Mobile: text button */}
              <button className="md:hidden text-[11px] font-bold text-[#00B5B5] border border-[#00B5B5] px-3 py-1.5 rounded-lg whitespace-nowrap hover:bg-[#E6F8F8] transition-colors duration-150">
                VER CERTIFICADO
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Page ───────────────────────────────────────────────────────────────────── */
export default function ProfilePage() {
  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <div className="px-4 md:px-6 pb-8 space-y-4">
        <ProfileCard />
        <StatsRow />

        {/* Mobile-only upgrade CTA */}
        <UpgradeCard />

        {/* Bottom section: desktop side-by-side, mobile stacked */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <BadgesSection />
          <CertificatesSection />
        </div>

        {/* Logout — mobile only */}
        <form action={logoutAction} className="md:hidden">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors duration-150"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar sesión
          </button>
        </form>
      </div>
    </div>
  )
}
