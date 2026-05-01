'use client'

import { useState } from 'react'

// Placeholder ads — replace with real images when available
const ADS = [
  {
    bg: 'from-blue-600 to-blue-800',
    brand: 'ContaPlus',
    tag: 'Software Contable',
    headline: 'Lleva tu contabilidad al siguiente nivel',
    cta: 'Prueba gratis 30 días',
  },
  {
    bg: 'from-emerald-600 to-teal-800',
    brand: 'BancaVE',
    tag: 'Servicios Financieros',
    headline: 'Abre tu cuenta en minutos desde el celular',
    cta: 'Conocer más',
  },
  {
    bg: 'from-purple-600 to-indigo-800',
    brand: 'MasterCode',
    tag: 'Bootcamp Online',
    headline: 'Aprende programación y duplica tu salario',
    cta: 'Ver programa',
  },
  {
    bg: 'from-rose-500 to-pink-700',
    brand: 'FreelanceVE',
    tag: 'Plataforma Freelance',
    headline: 'Consigue clientes y trabaja desde casa',
    cta: 'Registrarse gratis',
  },
]

type Props = {
  onClose: () => void
}

export default function AdBanner({ onClose }: Props) {
  const [ad] = useState(() => ADS[Math.floor(Math.random() * ADS.length)])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div className={`relative w-full max-w-sm rounded-2xl bg-gradient-to-br ${ad.bg} text-white overflow-hidden shadow-2xl`}>
        {/* Ad label */}
        <div className="absolute top-3 left-3 bg-black/30 text-white/80 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest">
          Publicidad
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-7 h-7 flex items-center justify-center bg-black/30 hover:bg-black/50 rounded-full transition-colors"
          aria-label="Cerrar anuncio"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        {/* Content */}
        <div className="px-6 pt-12 pb-8 flex flex-col items-center text-center gap-3">
          {/* Simulated logo */}
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mb-1">
            <span className="text-xl font-black">{ad.brand[0]}</span>
          </div>
          <p className="text-xs font-semibold text-white/70 uppercase tracking-widest">{ad.brand} · {ad.tag}</p>
          <h3 className="text-xl font-black leading-snug">{ad.headline}</h3>
          <button className="mt-2 px-6 py-2.5 bg-white text-gray-900 text-sm font-bold rounded-xl hover:bg-white/90 transition-colors">
            {ad.cta}
          </button>
          <button onClick={onClose} className="text-xs text-white/50 hover:text-white/80 transition-colors mt-1">
            Saltar anuncio
          </button>
        </div>
      </div>
    </div>
  )
}
