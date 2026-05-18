import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import { checkAndAwardBadges } from '@/lib/badges'
import { checkAndAdvanceLevel } from '@/lib/level'
import { logoutAction } from '@/app/actions/logout.actions'
import DashboardHeader from '@/components/dashboard/DashboardHeader'
import CertificatesSection from '@/components/dashboard/CertificatesSection'
import BadgesSection from '@/components/dashboard/BadgesSection'

export const metadata = { title: 'Perfil | Ruta Pro-VE' }

// ─── Label maps ───────────────────────────────────────────────────────────────

const CAREER_LABELS: Record<string, string> = {
  contaduria: 'Contaduría Pública',
  sistemas: 'Ingeniería de Sistemas',
}

const EDUCATION_LABELS: Record<string, string> = {
  bachiller: 'Bachiller',
  universitario: 'Estudiante universitario',
  recien_graduado: 'Recién graduado',
  graduado_experiencia: 'Graduado con experiencia',
}

const GOAL_LABELS: Record<string, string> = {
  primer_empleo: 'Conseguir primer empleo',
  crecer: 'Crecer en empleo actual',
  cambiar_area: 'Cambiar de área',
  freelance: 'Trabajar como freelance',
  emprender: 'Emprender',
}

const TIMELINE_LABELS: Record<string, string> = {
  urgente: '1 a 3 meses',
  seis_meses: '6 meses',
  un_año: '1 año',
  sin_prisa: 'Sin prisa',
}

const HOURS_LABELS: Record<string, string> = {
  uno_a_tres: '1 - 3 h / semana',
  tres_a_cinco: '3 - 5 h / semana',
  cinco_a_diez: '5 - 10 h / semana',
  diez_mas: '+10 h / semana',
}

const MODALITY_LABELS: Record<string, string> = {
  presencial: 'Presencial',
  remoto: 'Remoto',
  ambos: 'Ambas modalidades',
}

const STATUS_LABELS: Record<string, string> = {
  desempleado: 'Desempleado',
  empleado: 'Empleado',
  freelance: 'Freelance',
  estudiando: 'Estudiando a tiempo completo',
}

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-gray-100 text-gray-600',
  2: 'bg-blue-50 text-blue-600',
  3: 'bg-teal-50 text-[#00B5B5]',
  4: 'bg-purple-50 text-purple-600',
  5: 'bg-amber-50 text-amber-600',
}
function levelColor(id: number): string {
  return LEVEL_COLORS[id] ?? 'bg-indigo-50 text-indigo-600'
}

const STRENGTH_LEVEL_COLORS: Record<string, string> = {
  basico: 'bg-gray-100 text-gray-600',
  intermedio: 'bg-blue-50 text-blue-600',
  avanzado: 'bg-[#E6F8F8] text-[#007B7D]',
}

type StrengthEntry = { skill: string; level: string }

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProfilePage() {
  const supabase = await createClient()
  const { data: { user: authUser } } = await supabase.auth.getUser()
  if (!authUser) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      name: true,
      email: true,
      plan: true,
      createdAt: true,
      userStats: {
        select: { currentStreakDays: true, totalCoursesCompleted: true, totalXp: true, lastActivityDate: true },
      },
      badges: {
        include: { badge: { select: { name: true, iconUrl: true, description: true } } },
        orderBy: { awardedAt: 'desc' as const },
      },
      certificates: {
        include: {
          course: { select: { title: true } },
          payments: { where: { status: 'pending' }, select: { id: true, status: true } },
        },
        orderBy: { issuedAt: 'desc' as const },
      },
      studentProfile: {
        select: {
          career: true, educationLevel: true, university: true,
          academicYear: true, graduationYear: true,
          hasWorkExperience: true, workExperienceYears: true,
          jobRole: true, employmentStatus: true,
          primaryGoal: true, timeline: true,
          declaredStrengths: true,
          weeklyHours: true, location: true, workModality: true,
          assignedStartLevel: true, completedAt: true,
        },
      },
    },
  })

  if (!dbUser) redirect('/login')

  const profile = dbUser.studentProfile
  let stats = dbUser.userStats
  // Backfill: advance level for students who completed level courses before this feature existed
  if ((stats?.totalCoursesCompleted ?? 0) > 0) {
    await checkAndAdvanceLevel(authUser.id)
    // Re-read the updated level from the profile
    const refreshed = await prisma.studentProfile.findUnique({
      where: { userId: authUser.id },
      select: { assignedStartLevel: true },
    })
    if (refreshed && profile) profile.assignedStartLevel = refreshed.assignedStartLevel
  }

  const startLevel = profile?.assignedStartLevel ?? 1

  const currentLevelData = await prisma.level.findUnique({
    where: { id: startLevel },
    select: { name: true, description: true },
  })

  // Backfill: ensure UserStats exists
  if (!stats) {
    const [completedCourses, completedLessons] = await Promise.all([
      prisma.userCourseProgress.count({ where: { userId: authUser.id, status: 'completed' } }),
      prisma.userLessonProgress.count({ where: { userId: authUser.id } }),
    ])
    const xp = completedCourses * 100 + completedLessons * 10
    stats = await prisma.userStats.upsert({
      where: { userId: authUser.id },
      create: {
        userId: authUser.id,
        totalXp: xp,
        currentStreakDays: 0,
        longestStreak: 0,
        totalCoursesCompleted: completedCourses,
      },
      update: {},
      select: { currentStreakDays: true, totalCoursesCompleted: true, totalXp: true, lastActivityDate: true },
    })
  }

  // Effective streak display (Duolingo-style)
  const streakStatus = (() => {
    if (!stats?.lastActivityDate || !stats.currentStreakDays) return 'new' as const
    const today = new Date(); today.setUTCHours(0, 0, 0, 0)
    const last = new Date(stats.lastActivityDate); last.setUTCHours(0, 0, 0, 0)
    const diff = Math.round((today.getTime() - last.getTime()) / 86_400_000)
    if (diff === 0) return 'active' as const
    if (diff === 1) return 'frozen' as const
    return 'broken' as const
  })()
  const displayStreak = streakStatus === 'broken' ? 0 : (stats?.currentStreakDays ?? 0)
  const coursesCompleted = stats?.totalCoursesCompleted ?? 0
  const levelName = currentLevelData?.name ?? `Nivel ${startLevel}`
  const levelTitle = currentLevelData?.description ?? 'En Formación'
  const isPremium = dbUser.plan !== 'bronce'
  const memberYear = dbUser.createdAt ? new Date(dbUser.createdAt).getFullYear() : '—'
  const strengths = (profile?.declaredStrengths as StrengthEntry[]) ?? []
  const streak = displayStreak // kept for mobile mini-stat

  // Backfill badges for users who completed content before this feature existed
  let badgeList = dbUser.badges
  if (badgeList.length === 0 && (stats?.totalXp ?? 0) > 0) {
    await checkAndAwardBadges(authUser.id, { checkRouteComplete: true })
    badgeList = await prisma.userBadge.findMany({
      where: { userId: authUser.id },
      include: { badge: { select: { name: true, iconUrl: true, description: true } } },
      orderBy: { awardedAt: 'desc' },
    })
  }

  const [certPriceSetting, activeAccountsRaw, rawCoupons] = await Promise.all([
    prisma.appSetting.findUnique({ where: { key: 'certificate_price' } }),
    prisma.paymentAccount.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
      select: { id: true, method: true, label: true, details: true },
    }),
    prisma.certDiscount.findMany({
      where: { userId: authUser.id, usedAt: null, paymentId: null, expiresAt: { gt: new Date() } },
      select: { id: true, discountPct: true, expiresAt: true },
      orderBy: { expiresAt: 'asc' },
    }),
  ])
  const certPrice = certPriceSetting?.value ?? '5.00'
  const activeAccounts = activeAccountsRaw.map(a => ({
    ...a,
    details: a.details as { phone?: string; bank?: string; ci?: string; holder?: string; network?: string; wallet?: string; email?: string },
  }))
  const availableCoupons = rawCoupons.map(c => ({
    id: c.id,
    discountPct: c.discountPct,
    expiresAt: c.expiresAt.toISOString(),
  }))

  return (
    <div className="min-h-screen">
      <DashboardHeader />

      <div className="px-4 md:px-6 pb-32 md:pb-8 space-y-4">

        {/* ── Profile card ── */}
        <div className="bg-white rounded-2xl overflow-hidden shadow-sm">
          {/* Desktop */}
          <div className="hidden md:flex items-center gap-6 p-6 relative">
            <div className="w-28 h-28 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              <div className="w-full h-full bg-gradient-to-br from-slate-600 to-slate-900 flex items-center justify-center">
                <svg className="w-14 h-14 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold tracking-widest text-[#00B5B5] uppercase">
                  Estudiante — {levelName}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <h1 className="text-2xl font-black text-gray-900 truncate max-w-full">{dbUser.name}</h1>
                {dbUser.plan === 'bronce' && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-200">Bronce</span>
                )}
                {dbUser.plan === 'plata' && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Plata</span>
                )}
                {dbUser.plan === 'oro' && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">Oro</span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                {profile?.location && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {profile.location}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Miembro desde {memberYear}
                </span>
                {profile?.career && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                    {CAREER_LABELS[profile.career] ?? profile.career}
                  </span>
                )}
              </div>
            </div>
            <div className="hidden lg:flex w-28 h-28 items-end justify-center opacity-10 shrink-0">
              <svg viewBox="0 0 80 100" className="w-full h-full fill-gray-400">
                <ellipse cx="40" cy="28" rx="18" ry="18" />
                <path d="M10 100 Q10 60 40 55 Q70 60 70 100 Z" />
              </svg>
            </div>
            <button className="shrink-0 px-5 py-2.5 rounded-xl bg-[#1B4F8C] text-white text-sm font-semibold hover:bg-[#1A3C6E] transition-colors shadow-sm">
              Editar Perfil
            </button>
          </div>

          {/* Mobile */}
          <div className="md:hidden flex flex-col items-center py-8 px-6 gap-3">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-slate-600 to-slate-900 flex items-center justify-center">
              <svg className="w-10 h-10 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="text-center w-full min-w-0">
              <div className="flex flex-wrap items-center justify-center gap-2">
                <h1 className="text-xl font-black text-gray-900 truncate max-w-full">{dbUser.name}</h1>
                {dbUser.plan === 'bronce' && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-200">Bronce</span>
                )}
                {dbUser.plan === 'plata' && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">Plata</span>
                )}
                {dbUser.plan === 'oro' && (
                  <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full bg-amber-100 text-amber-600">Oro</span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-0.5">{dbUser.email}</p>
            </div>
            <div className="flex gap-px overflow-hidden rounded-xl border border-gray-100 w-full mt-1">
              <div className="flex-1 py-3 text-center bg-gray-50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Racha</p>
                <p className="text-lg font-black text-gray-900">{streak} días</p>
              </div>
              <div className="flex-1 py-3 text-center bg-gray-50">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-0.5">Nivel</p>
                <p className="text-lg font-black text-gray-900">{levelName}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Stats row (desktop) ── */}
        <div className="hidden md:grid grid-cols-3 gap-4">
          <div className={`relative rounded-2xl overflow-hidden text-white p-5 shadow-sm bg-gradient-to-br ${
            streakStatus === 'active' ? 'from-orange-400 to-orange-600' :
            streakStatus === 'frozen' ? 'from-sky-400 to-blue-600' :
            'from-[#4B9BFB] to-[#1A5FD4]'
          }`}>
            <div className="absolute bottom-0 left-0 right-0 h-16 opacity-10">
              <svg viewBox="0 0 300 60" className="w-full h-full" preserveAspectRatio="none">
                <path d="M0 30 Q75 0 150 30 Q225 60 300 30 L300 60 L0 60 Z" fill="white" />
              </svg>
            </div>
            <div className="flex items-center gap-2 mb-1">
              <p className="font-bold text-sm">Racha de Aprendizaje</p>
              {streakStatus === 'frozen' && (
                <span className="text-xs bg-white/20 px-2 py-0.5 rounded-full font-semibold">Congelada</span>
              )}
            </div>
            <p className="text-white/70 text-xs mb-4">
              {streakStatus === 'active'
                ? `Has mantenido tu ritmo por ${displayStreak} ${displayStreak === 1 ? 'dia' : 'dias'} consecutivos.`
                : streakStatus === 'frozen'
                  ? 'Completa una leccion hoy para mantener tu racha.'
                  : 'Empieza hoy tu racha de aprendizaje.'}
            </p>
            <div className="flex items-end gap-3">
              <p className="text-5xl font-black">{displayStreak}<span className="text-xl font-semibold ml-2">dias</span></p>
              <span className="text-3xl mb-1">{streakStatus === 'active' ? '🔥' : streakStatus === 'frozen' ? '🧊' : '🔥'}</span>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 flex flex-col items-center justify-center gap-2 shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#E6F8F8] flex items-center justify-center">
              <svg className="w-6 h-6 text-[#00B5B5]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <p className="text-4xl font-black text-gray-900">{coursesCompleted}</p>
            <p className="text-sm text-gray-500">Cursos Completados</p>
          </div>

          <div className="rounded-2xl bg-white p-5 flex flex-col items-center justify-center gap-2 shadow-sm">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${levelColor(startLevel)}`}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </div>
            <p className="text-4xl font-black text-gray-900">{levelName}</p>
            <p className="text-sm text-gray-500">{levelTitle}</p>
          </div>
        </div>

        {/* ── Onboarding summary ── */}
        {profile && (
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h2 className="font-bold text-gray-900">Mi perfil de aprendizaje</h2>
                <p className="text-xs text-gray-400 mt-0.5">Información recolectada durante tu onboarding</p>
              </div>
              <span className="text-xs text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">
                {levelName} — {levelTitle}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
              <InfoRow icon="🎓" label="Carrera" value={CAREER_LABELS[profile.career] ?? profile.career} />
              <InfoRow icon="📚" label="Nivel educativo" value={EDUCATION_LABELS[profile.educationLevel] ?? profile.educationLevel} />
              {profile.university && <InfoRow icon="🏛️" label="Universidad" value={profile.university} />}
              {profile.academicYear && <InfoRow icon="📅" label="Año / semestre" value={profile.academicYear} />}
              {profile.graduationYear && <InfoRow icon="🎉" label="Año de graduación" value={String(profile.graduationYear)} />}
              <InfoRow icon="💼" label="Situación actual" value={STATUS_LABELS[profile.employmentStatus] ?? profile.employmentStatus} />
              {profile.hasWorkExperience && profile.workExperienceYears != null && (
                <InfoRow icon="⏱️" label="Experiencia laboral" value={`${profile.workExperienceYears} ${profile.workExperienceYears === 1 ? 'año' : 'años'}`} />
              )}
              {profile.jobRole && <InfoRow icon="🏷️" label="Cargo / rol" value={profile.jobRole} />}
              <InfoRow icon="🎯" label="Objetivo principal" value={GOAL_LABELS[profile.primaryGoal] ?? profile.primaryGoal} />
              <InfoRow icon="⏳" label="Plazo de tiempo" value={TIMELINE_LABELS[profile.timeline] ?? profile.timeline} />
              <InfoRow icon="🕐" label="Disponibilidad" value={HOURS_LABELS[profile.weeklyHours] ?? profile.weeklyHours} />
              <InfoRow icon="📍" label="Ubicación" value={profile.location} />
              <InfoRow icon="🖥️" label="Modalidad" value={MODALITY_LABELS[profile.workModality] ?? profile.workModality} />
            </div>

            {strengths.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Fortalezas declaradas</p>
                <div className="flex flex-wrap gap-2">
                  {strengths.map((s) => (
                    <span key={s.skill}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold ${STRENGTH_LEVEL_COLORS[s.level] ?? 'bg-gray-100 text-gray-600'}`}>
                      {s.skill}
                      <span className="opacity-60 font-normal capitalize">{s.level}</span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Badges & Certificates ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Badges */}
          <BadgesSection badges={badgeList} />

          {/* Certificates */}
          <div className="bg-white rounded-2xl p-5 shadow-sm">
            <CertificatesSection
              certs={dbUser.certificates}
              certPrice={certPrice}
              paymentAccounts={activeAccounts}
              availableCoupons={availableCoupons}
            />
          </div>
        </div>

        {/* Mobile upgrade CTA */}
        {!isPremium && (
          <div className="md:hidden rounded-2xl bg-gradient-to-br from-[#1B6EF5] to-[#0A4BCC] text-white p-5">
            <p className="font-black text-base uppercase tracking-wide mb-1">Desbloquea el Mapa Completo</p>
            <p className="text-white/75 text-xs leading-relaxed mb-4">
              Acceso a certificados oficiales, mentoría 1:1 y contenido exclusivo.
            </p>
            <button className="w-full py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-sm transition-colors">
              Actualizar a Premium
            </button>
          </div>
        )}

        {/* Mobile logout */}
        <form action={logoutAction} className="md:hidden">
          <button type="submit" className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-red-200 text-red-500 text-sm font-semibold hover:bg-red-50 transition-colors">
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

// ─── Helper ───────────────────────────────────────────────────────────────────

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 px-3 py-2.5 rounded-xl bg-gray-50">
      <span className="text-base shrink-0 mt-0.5">{icon}</span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-800 mt-0.5">{value}</p>
      </div>
    </div>
  )
}
