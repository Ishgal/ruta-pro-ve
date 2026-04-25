'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

/* ─── Inline SVG icons ─── */

function IconArrow() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7l3 3L11.5 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconBrain() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2C9.5 2 7.5 3.5 7 5.5C5.5 5.8 4 7.2 4 9c0 1.2.6 2.2 1.5 2.8C5.2 12.5 5 13.2 5 14c0 2.2 1.8 4 4 4h6c2.2 0 4-1.8 4-4 0-.8-.2-1.5-.5-2.2.9-.6 1.5-1.6 1.5-2.8 0-1.8-1.5-3.2-3-3.5C16.5 3.5 14.5 2 12 2z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 14v2M12 14v2M15 14v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconMap() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3 7l6-3 6 3 6-3v13l-6 3-6-3-6 3V7z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M9 4v13M15 7v13" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

function IconTrophy() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M8 21h8M12 17v4M7 4H4v4c0 2.2 1.8 4 4 4M17 4h3v4c0 2.2-1.8 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M7 4h10v8c0 2.8-2.2 5-5 5s-5-2.2-5-5V4z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function IconCertificate() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="4" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 9h10M7 12h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="19" r="3" stroke="currentColor" strokeWidth="1.5" />
      <path d="M14.5 21.5l-2 2M17.5 21.5l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

/* ─── Data ─── */

const STEPS = [
  {
    number: '01',
    title: 'Cuéntale a la IA sobre ti',
    description: 'Un onboarding conversacional analiza tu formación, metas y tiempo disponible para construir tu perfil.',
    Icon: IconBrain,
  },
  {
    number: '02',
    title: 'Obtén tu ruta personalizada',
    description: 'En minutos, la IA genera un plan de aprendizaje adaptado exactamente a lo que el mercado venezolano necesita.',
    Icon: IconMap,
  },
  {
    number: '03',
    title: 'Aprende con cursos gamificados',
    description: 'Completa módulos interactivos, gana XP, sube de nivel y compite con tu comunidad de estudiantes.',
    Icon: IconTrophy,
  },
  {
    number: '04',
    title: 'Certifícate y consigue empleo',
    description: 'Obtén certificados reconocidos y conecta directamente con empleadores del sector en Venezuela.',
    Icon: IconCertificate,
  },
]

const COURSES = [
  {
    id: 1,
    category: 'Contabilidad',
    title: 'Fundamentos de Contabilidad Venezolana',
    level: 'Básico',
    duration: '8 horas',
    modules: 12,
    xp: 400,
    enrolled: 3241,
    accentBg: '#E8F0FB',
    accentText: '#1B4F8C',
    accentBar: '#1B4F8C',
  },
  {
    id: 2,
    category: 'Excel y Herramientas',
    title: 'Excel Financiero para Contadores',
    level: 'Intermedio',
    duration: '12 horas',
    modules: 18,
    xp: 650,
    enrolled: 2180,
    accentBg: '#E6F8F8',
    accentText: '#007B7D',
    accentBar: '#00B5B5',
  },
  {
    id: 3,
    category: 'Tributario',
    title: 'Declaraciones de ISLR e IVA en Venezuela',
    level: 'Intermedio',
    duration: '10 horas',
    modules: 15,
    xp: 550,
    enrolled: 1847,
    accentBg: '#FEF3C7',
    accentText: '#92400E',
    accentBar: '#F59E0B',
  },
]

const TESTIMONIALS = [
  {
    name: 'María García',
    role: 'Contadora — Deloitte Venezuela',
    institution: 'UCV · Egresada 2024',
    quote: 'Terminé mi carrera sin saber hacer una declaración de IVA real. Ruta Pro-VE me dio exactamente las herramientas que el trabajo me pedía desde el primer día.',
    initials: 'MG',
    avatarBg: '#1B4F8C',
  },
  {
    name: 'Carlos Mendoza',
    role: 'Contador Independiente',
    institution: 'UCAB · Egresado 2023',
    quote: 'Los cursos están diseñados para el mercado venezolano, no para otro país. Eso hace una diferencia brutal cuando empiezas a buscar clientes.',
    initials: 'CM',
    avatarBg: '#007B7D',
  },
  {
    name: 'Ana Rodríguez',
    role: 'Analista Financiero Jr.',
    institution: 'UCLA · Egresada 2025',
    quote: 'La IA entendió que yo ya tenía la teoría pero necesitaba práctica. Me ahorró meses de buscar qué estudiar por mi cuenta.',
    initials: 'AR',
    avatarBg: '#2A4E7A',
  },
]

/* ─── Hero: Ruta de Aprendizaje UI Card ─── */

function LearningPathCard() {
  return (
    <div
      className="bg-white rounded-2xl w-full"
      style={{
        maxWidth: '340px',
        boxShadow: '0 24px 64px rgba(0,0,0,0.28)',
      }}
    >
      {/* Card header */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: '1px solid #EEF2FA' }}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#8BAECE' }}>
              Tu Ruta
            </p>
            <h3
              className="text-sm font-bold leading-tight"
              style={{ fontFamily: 'var(--font-bricolage)', color: '#0D2040' }}
            >
              Contabilidad Profesional
            </h3>
          </div>
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: '#E6F8F8', color: '#007B7D' }}
          >
            IA activa
          </span>
        </div>
      </div>

      {/* Module list */}
      <div className="px-5 py-4 space-y-3">

        {/* Completed modules */}
        {['Fundamentos Contables', 'Excel Financiero'].map((m) => (
          <div key={m} className="flex items-center gap-3">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#D1FAE5' }}
            >
              <IconCheck className="text-emerald-600" />
            </div>
            <span className="text-xs line-through" style={{ color: '#94A3B8' }}>
              {m}
            </span>
          </div>
        ))}

        {/* Active module */}
        <div className="rounded-xl p-3" style={{ backgroundColor: '#F0F7FF' }}>
          <div className="flex items-center gap-2.5 mb-2">
            <div
              className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: '#00B5B5' }}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
                <path d="M3 5h4M5 3v4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>
            <span className="text-xs font-semibold flex-1" style={{ color: '#0D2040' }}>
              Declaraciones ISLR
            </span>
            <span className="text-[10px] font-bold" style={{ color: '#007B7D' }}>67%</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: '#DBEAFE' }}>
            <div className="h-full rounded-full" style={{ width: '67%', backgroundColor: '#00B5B5' }} />
          </div>
        </div>

        {/* Upcoming modules */}
        {['Costos y Presupuestos', 'Auditoría Básica'].map((m) => (
          <div key={m} className="flex items-center gap-3 opacity-40">
            <div
              className="w-5 h-5 rounded-full shrink-0"
              style={{ border: '1.5px dashed #94A3B8' }}
            />
            <span className="text-xs" style={{ color: '#64748B' }}>
              {m}
            </span>
          </div>
        ))}
      </div>

      {/* XP footer */}
      <div className="px-5 pb-5" style={{ borderTop: '1px solid #EEF2FA', paddingTop: '12px' }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-bold" style={{ color: '#F59E0B' }}>
            1,240 XP
          </span>
          <span className="text-[10px]" style={{ color: '#94A3B8' }}>
            Nivel 4 · 2,000 XP
          </span>
        </div>
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: '#F1F5F9' }}>
          <div className="h-full rounded-full" style={{ width: '62%', backgroundColor: '#F59E0B' }} />
        </div>
        <p className="text-[10px] mt-1.5 font-medium" style={{ color: '#94A3B8' }}>
          Nivel 3 — Contador Junior
        </p>
      </div>
    </div>
  )
}

/* ─── Main landing page ─── */

export default function Home() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 56)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div style={{ fontFamily: 'var(--font-nunito), system-ui, sans-serif' }}>

      {/* ══════════════════════════════════════
          NAVBAR
      ══════════════════════════════════════ */}
      <nav
        className="fixed top-0 inset-x-0 z-50 transition-all duration-200"
        style={{
          backgroundColor: scrolled ? 'rgba(255,255,255,0.97)' : 'transparent',
          boxShadow: scrolled ? '0 1px 0 rgba(0,0,0,0.08)' : 'none',
          backdropFilter: scrolled ? 'blur(8px)' : 'none',
        }}
      >
        <div
          className="mx-auto flex items-center justify-between"
          style={{ maxWidth: '1280px', padding: '0 24px', height: '64px' }}
        >
          {/* Logo */}
          <a
            href="#"
            className="font-black text-xl tracking-tight select-none"
            style={{
              fontFamily: 'var(--font-bricolage)',
              color: scrolled ? '#0D2040' : '#F0F6FF',
            }}
            aria-label="Ruta Pro-VE — Ir al inicio"
          >
            Ruta Pro<span style={{ color: '#00B5B5' }}>-VE</span>
          </a>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-8">
            {[
              { label: '¿Cómo funciona?', href: '#como-funciona' },
              { label: 'Cursos', href: '#cursos' },
              { label: 'Testimonios', href: '#testimonios' },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="text-sm font-medium transition-opacity hover:opacity-70"
                style={{ color: scrolled ? '#4A5568' : '#B8D0E8' }}
              >
                {label}
              </a>
            ))}
            <Link
              href="/login"
              className="text-sm font-semibold transition-opacity hover:opacity-70"
              style={{ color: scrolled ? '#1B4F8C' : '#B8D0E8' }}
            >
              Iniciar sesión
            </Link>
            <Link
              href="/register"
              className="text-sm font-bold px-5 py-2.5 rounded-full transition-all hover:scale-[1.03] active:scale-[0.97]"
              style={{
                backgroundColor: scrolled ? '#1B4F8C' : '#FFFFFF',
                color: scrolled ? '#FFFFFF' : '#0D2040',
              }}
            >
              Comenzar gratis
            </Link>
          </div>

          {/* Mobile CTA */}
          <Link
            href="/register"
            className="md:hidden text-sm font-bold px-4 py-2 rounded-full"
            style={{
              backgroundColor: scrolled ? '#1B4F8C' : '#FFFFFF',
              color: scrolled ? '#FFFFFF' : '#0D2040',
            }}
          >
            Comenzar
          </Link>
        </div>
      </nav>

      {/* ══════════════════════════════════════
          HERO
      ══════════════════════════════════════ */}
      <section
        className="relative flex items-center"
        style={{ backgroundColor: '#0D2040', minHeight: '100dvh' }}
      >
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Ambient teal glow — top right */}
        <div
          className="absolute top-0 right-0 pointer-events-none"
          style={{
            width: '480px',
            height: '480px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(0,181,181,0.12) 0%, transparent 70%)',
            transform: 'translate(30%, -30%)',
          }}
        />

        <div
          className="relative w-full mx-auto"
          style={{ maxWidth: '1280px', padding: '96px 24px 80px' }}
        >
          <div
            className="grid items-center gap-12"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 440px), 1fr))' }}
          >

            {/* ── Left: copy ── */}
            <div className="animate-fade-in-up">

              {/* Status label */}
              <div className="inline-flex items-center gap-2 mb-6">
                <span
                  className="w-2 h-2 rounded-full animate-pulse-dot"
                  style={{ backgroundColor: '#00B5B5' }}
                />
                <span
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: '#00B5B5' }}
                >
                  EdTech venezolana · Carrera de Contabilidad
                </span>
              </div>

              {/* Headline */}
              <h1
                className="font-black leading-[1.03] tracking-tight mb-5"
                style={{
                  fontFamily: 'var(--font-bricolage)',
                  fontSize: 'clamp(40px, 5.5vw, 80px)',
                  color: '#F0F6FF',
                }}
              >
                Convierte tu título
                <br />
                en una carrera
                <br />
                <span style={{ color: '#00B5B5' }}>real.</span>
              </h1>

              {/* Subheadline */}
              <p
                className="leading-relaxed mb-8"
                style={{
                  fontSize: 'clamp(16px, 1.5vw, 19px)',
                  color: '#8BAECE',
                  maxWidth: '480px',
                }}
              >
                Una IA que analiza tu perfil, diseña tu ruta y te prepara
                exactamente para lo que el mercado venezolano necesita hoy.
              </p>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 mb-12">
                <Link
                  href="/register"
                  className="inline-flex items-center justify-center gap-2 font-bold rounded-full transition-all hover:scale-[1.03] active:scale-[0.97]"
                  style={{
                    padding: '14px 28px',
                    backgroundColor: '#FFFFFF',
                    color: '#0D2040',
                    fontSize: '15px',
                  }}
                >
                  Crear mi ruta gratis
                  <IconArrow />
                </Link>
                <a
                  href="#como-funciona"
                  className="inline-flex items-center justify-center gap-2 font-semibold rounded-full transition-colors"
                  style={{
                    padding: '14px 28px',
                    color: '#00B5B5',
                    border: '1.5px solid rgba(0,181,181,0.30)',
                    fontSize: '15px',
                  }}
                >
                  Ver cómo funciona
                </a>
              </div>

              {/* Stats */}
              <div className="flex gap-8 flex-wrap">
                {[
                  { value: '10,000+', label: 'estudiantes activos' },
                  { value: '150+', label: 'cursos disponibles' },
                  { value: '94%', label: 'tasa de empleabilidad' },
                ].map(({ value, label }) => (
                  <div key={label}>
                    <p
                      className="font-black leading-none mb-1"
                      style={{
                        fontFamily: 'var(--font-bricolage)',
                        fontSize: '26px',
                        color: '#F0F6FF',
                      }}
                    >
                      {value}
                    </p>
                    <p className="text-xs" style={{ color: '#4A6A84' }}>
                      {label}
                    </p>
                  </div>
                ))}
              </div>

              {/* University trust line */}
              <p className="mt-8 text-xs" style={{ color: '#4A6A84' }}>
                Estudiantes de{' '}
                {['UCV', 'UCAB', 'UCLA', 'UDO', 'UNIMET'].map((u, i, arr) => (
                  <span key={u}>
                    <span style={{ color: '#6D8FAA' }}>{u}</span>
                    {i < arr.length - 1 ? ', ' : ''}
                  </span>
                ))}{' '}
                y más.
              </p>
            </div>

            {/* ── Right: UI card ── */}
            <div
              className="hidden lg:flex justify-center animate-fade-in-right"
              aria-hidden="true"
            >
              <div className="relative" style={{ transform: 'rotate(2.5deg)' }}>
                {/* Glow behind card */}
                <div
                  className="absolute inset-0 rounded-2xl"
                  style={{
                    background: 'radial-gradient(ellipse, rgba(0,181,181,0.25) 0%, transparent 70%)',
                    transform: 'scale(1.1) translateY(12px)',
                    filter: 'blur(24px)',
                  }}
                />
                <LearningPathCard />
              </div>
            </div>
          </div>
        </div>

        {/* Wave transition to next section */}
        <div className="absolute bottom-0 inset-x-0 pointer-events-none" style={{ lineHeight: 0 }}>
          <svg viewBox="0 0 1440 56" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', display: 'block' }}>
            <path
              d="M0 56V28C240 0 480 56 720 28C900 8 1080 0 1440 8V56H0Z"
              fill="#F4F7FB"
            />
          </svg>
        </div>
      </section>

      {/* ══════════════════════════════════════
          HOW IT WORKS
      ══════════════════════════════════════ */}
      <section
        id="como-funciona"
        style={{ backgroundColor: '#F4F7FB', padding: '96px 0' }}
      >
        <div className="mx-auto" style={{ maxWidth: '1280px', padding: '0 24px' }}>

          <div className="mb-16">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: '#00B5B5' }}
            >
              El proceso
            </p>
            <h2
              className="font-black leading-tight"
              style={{
                fontFamily: 'var(--font-bricolage)',
                fontSize: 'clamp(30px, 4vw, 52px)',
                color: '#0D2040',
                maxWidth: '560px',
              }}
            >
              De estudiante a profesional
              <br />
              en cuatro pasos.
            </h2>
          </div>

          <div
            className="grid gap-8 stagger-children"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}
          >
            {STEPS.map(({ number, title, description, Icon }) => (
              <div key={number} className="animate-fade-in-up">
                {/* Large background number */}
                <div
                  className="font-black select-none leading-none mb-3"
                  style={{
                    fontFamily: 'var(--font-bricolage)',
                    fontSize: '80px',
                    color: '#1B4F8C',
                    opacity: 0.07,
                  }}
                >
                  {number}
                </div>

                {/* Content shifted up to overlap number */}
                <div style={{ marginTop: '-56px' }}>
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center mb-3"
                    style={{ backgroundColor: '#E8F0FB', color: '#1B4F8C' }}
                  >
                    <Icon />
                  </div>
                  <h3
                    className="font-bold mb-2"
                    style={{
                      fontFamily: 'var(--font-bricolage)',
                      fontSize: '16px',
                      color: '#0D2040',
                    }}
                  >
                    {title}
                  </h3>
                  <p
                    className="text-sm leading-relaxed"
                    style={{ color: '#5A7085', maxWidth: '260px' }}
                  >
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FEATURED COURSES
      ══════════════════════════════════════ */}
      <section
        id="cursos"
        style={{ backgroundColor: '#FFFFFF', padding: '96px 0' }}
      >
        <div className="mx-auto" style={{ maxWidth: '1280px', padding: '0 24px' }}>

          <div
            className="flex items-end justify-between mb-12 gap-4"
            style={{ flexWrap: 'wrap' }}
          >
            <div>
              <p
                className="text-xs font-bold uppercase tracking-widest mb-3"
                style={{ color: '#00B5B5' }}
              >
                Cursos destacados
              </p>
              <h2
                className="font-black leading-tight"
                style={{
                  fontFamily: 'var(--font-bricolage)',
                  fontSize: 'clamp(28px, 3.5vw, 44px)',
                  color: '#0D2040',
                }}
              >
                Empieza con los
                <br />
                más populares.
              </h2>
            </div>
            <Link
              href="/register"
              className="hidden md:inline-flex items-center gap-1.5 text-sm font-semibold transition-opacity hover:opacity-60"
              style={{ color: '#1B4F8C' }}
            >
              Ver todos los cursos <IconArrow />
            </Link>
          </div>

          <div
            className="grid gap-6"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))' }}
          >
            {COURSES.map((course) => (
              <article
                key={course.id}
                className="rounded-2xl overflow-hidden flex flex-col"
                style={{
                  border: '1px solid #E2E8F4',
                  backgroundColor: '#FFFFFF',
                }}
              >
                {/* Colored top header band — full width, intentional, not a border stripe */}
                <div
                  className="px-5 pt-5 pb-4"
                  style={{ backgroundColor: course.accentBg }}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className="text-xs font-bold px-2.5 py-1 rounded-full"
                      style={{
                        backgroundColor: 'rgba(255,255,255,0.7)',
                        color: course.accentText,
                      }}
                    >
                      {course.category}
                    </span>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: course.accentText, opacity: 0.8 }}
                    >
                      {course.level}
                    </span>
                  </div>
                </div>

                {/* Card body */}
                <div className="p-5 flex flex-col flex-1">
                  <h3
                    className="font-bold leading-snug mb-4 flex-1"
                    style={{
                      fontFamily: 'var(--font-bricolage)',
                      fontSize: '16px',
                      color: '#0D2040',
                    }}
                  >
                    {course.title}
                  </h3>

                  {/* Meta row */}
                  <div
                    className="flex items-center gap-3 text-xs mb-5"
                    style={{ color: '#94A3B8' }}
                  >
                    <span>{course.duration}</span>
                    <span aria-hidden>·</span>
                    <span>{course.modules} módulos</span>
                    <span aria-hidden>·</span>
                    <span>{course.enrolled.toLocaleString('es-VE')} inscritos</span>
                  </div>

                  {/* XP + CTA */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                        <path d="M7 1l1.5 3 3.5.5-2.5 2.5.5 3.5L7 9 4 10.5l.5-3.5L2 4.5 5.5 4 7 1z" fill="#F59E0B" />
                      </svg>
                      <span className="text-sm font-bold" style={{ color: '#F59E0B' }}>
                        +{course.xp} XP
                      </span>
                    </div>
                    <Link
                      href="/register"
                      className="text-sm font-semibold px-4 py-2 rounded-full transition-all hover:scale-[1.04] active:scale-[0.97]"
                      style={{
                        backgroundColor: course.accentBg,
                        color: course.accentText,
                      }}
                    >
                      Ver curso →
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          {/* Mobile: see all link */}
          <div className="mt-8 text-center md:hidden">
            <Link
              href="/register"
              className="inline-flex items-center gap-1.5 text-sm font-semibold"
              style={{ color: '#1B4F8C' }}
            >
              Ver todos los cursos <IconArrow />
            </Link>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          TESTIMONIALS
      ══════════════════════════════════════ */}
      <section
        id="testimonios"
        style={{ backgroundColor: '#F4F7FB', padding: '96px 0' }}
      >
        <div className="mx-auto" style={{ maxWidth: '1280px', padding: '0 24px' }}>

          <div className="mb-12">
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: '#00B5B5' }}
            >
              Historias reales
            </p>
            <h2
              className="font-black leading-tight"
              style={{
                fontFamily: 'var(--font-bricolage)',
                fontSize: 'clamp(28px, 3.5vw, 44px)',
                color: '#0D2040',
              }}
            >
              Ellos ya transformaron
              <br />
              su carrera.
            </h2>
          </div>

          <div
            className="grid gap-5"
            style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))' }}
          >
            {TESTIMONIALS.map((t) => (
              <blockquote
                key={t.name}
                className="bg-white rounded-2xl p-6 flex flex-col"
                style={{ border: '1px solid #E2E8F4' }}
              >
                {/* Avatar + name */}
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 select-none"
                    style={{ backgroundColor: t.avatarBg }}
                    aria-hidden="true"
                  >
                    {t.initials}
                  </div>
                  <div>
                    <cite className="text-sm font-bold not-italic" style={{ color: '#0D2040' }}>
                      {t.name}
                    </cite>
                    <p className="text-xs" style={{ color: '#94A3B8' }}>
                      {t.institution}
                    </p>
                  </div>
                </div>

                {/* Quote */}
                <p
                  className="text-sm leading-relaxed flex-1 mb-4"
                  style={{ color: '#4A6070' }}
                >
                  &ldquo;{t.quote}&rdquo;
                </p>

                {/* Role */}
                <p className="text-xs font-semibold" style={{ color: '#00B5B5' }}>
                  {t.role}
                </p>
              </blockquote>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FINAL CTA
      ══════════════════════════════════════ */}
      <section style={{ backgroundColor: '#0D2040', padding: '96px 0' }}>
        {/* Dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
          aria-hidden="true"
        />

        <div
          className="relative mx-auto text-center"
          style={{ maxWidth: '640px', padding: '0 24px' }}
        >
          <h2
            className="font-black mb-4"
            style={{
              fontFamily: 'var(--font-bricolage)',
              fontSize: 'clamp(30px, 4vw, 54px)',
              color: '#F0F6FF',
              lineHeight: '1.05',
            }}
          >
            ¿Listo para transformar
            <br />
            tu carrera?
          </h2>
          <p
            className="mb-8"
            style={{ fontSize: '18px', color: '#8BAECE', lineHeight: '1.6' }}
          >
            Únete a 10,000+ estudiantes que ya comenzaron su ruta.
          </p>

          <Link
            href="/register"
            className="inline-flex items-center gap-2 font-bold rounded-full transition-all hover:scale-[1.04] active:scale-[0.97]"
            style={{
              padding: '16px 36px',
              backgroundColor: '#FFFFFF',
              color: '#0D2040',
              fontSize: '16px',
            }}
          >
            Crear mi cuenta gratis
            <IconArrow />
          </Link>

          <p className="mt-5 text-xs" style={{ color: '#344F66' }}>
            Sin tarjeta de crédito · Empieza en 2 minutos
          </p>
        </div>
      </section>

      {/* ══════════════════════════════════════
          FOOTER
      ══════════════════════════════════════ */}
      <footer style={{ backgroundColor: '#071527', padding: '40px 0', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
        <div
          className="mx-auto flex flex-col md:flex-row items-center justify-between gap-4"
          style={{ maxWidth: '1280px', padding: '0 24px' }}
        >
          <span
            className="font-black text-lg select-none"
            style={{ fontFamily: 'var(--font-bricolage)', color: '#F0F6FF' }}
          >
            Ruta Pro<span style={{ color: '#00B5B5' }}>-VE</span>
          </span>

          <nav
            className="flex flex-wrap justify-center gap-6"
            aria-label="Footer"
          >
            {['Cursos', 'Nosotros', 'Blog', 'Contacto', 'Privacidad', 'Términos'].map((link) => (
              <a
                key={link}
                href="#"
                className="text-xs transition-opacity hover:opacity-80"
                style={{ color: '#4A6A84' }}
              >
                {link}
              </a>
            ))}
          </nav>

          <p className="text-xs" style={{ color: '#344F66' }}>
            © 2026 Ruta Pro-VE
          </p>
        </div>
      </footer>
    </div>
  )
}
