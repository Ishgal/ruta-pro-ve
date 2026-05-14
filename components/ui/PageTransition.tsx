'use client'

import { motion } from 'framer-motion'
import { usePathname } from 'next/navigation'
import { useRef } from 'react'

/*
  Profundidad de ruta para determinar dirección del slide.
  Mayor profundidad → slide desde la derecha (avanzar).
  Menor profundidad → slide desde la izquierda (retroceder).
*/
function getRouteDepth(pathname: string): number {
  // ── Módulo de estudiantes ──
  if (pathname === '/dashboard') return 0
  if (/^\/dashboard\/courses\/[^/]+/.test(pathname)) return 2

  // ── Módulo de docentes ──
  if (pathname === '/teacher-dashboard') return 0
  if (/^\/teacher-dashboard\/students\/[^/]+/.test(pathname)) return 2
  if (/^\/teacher-dashboard\/courses\/[^/]+/.test(pathname)) return 2

  // Cualquier otra subruta de ambos módulos (nivel 1)
  return 1
}

export default function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  const prevPathRef = useRef(pathname)
  const directionRef = useRef(1) // 1 = entra desde derecha, -1 = entra desde izquierda

  if (prevPathRef.current !== pathname) {
    const prevDepth = getRouteDepth(prevPathRef.current)
    const currDepth = getRouteDepth(pathname)
    directionRef.current = currDepth >= prevDepth ? 1 : -1
    prevPathRef.current = pathname
  }

  return (
    <motion.div
      key={pathname}
      initial={{ x: `${directionRef.current * 100}%` }}
      animate={{ x: 0 }}
      transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
      className="h-full"
    >
      {children}
    </motion.div>
  )
}
