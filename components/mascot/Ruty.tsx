'use client'

import { motion } from 'framer-motion'
import type { TargetAndTransition, Transition } from 'framer-motion'
import Image from 'next/image'
import { useState } from 'react'

export type RutyPose =
  | 'neutral'
  | 'saludando'
  | 'pensando'
  | 'celebrando'
  | 'leyendo'
  | 'triste'
  | 'hablando'
  | 'sorprendido'

interface RutyProps {
  pose?: RutyPose
  /** Ancho fijo en px — para la mayoria de usos */
  size?: number
  /** Alto fijo en px — usar en el chat para que el zorro llene el espacio vertical */
  height?: number
  /** Desactiva la animacion de loop — para pantallas de resultado */
  noAnim?: boolean
  className?: string
}

const poseAnimations: Record<RutyPose, { animate: TargetAndTransition; transition: Transition }> = {
  neutral: {
    animate: { scale: [1, 1.025, 1] },
    transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' },
  },
  saludando: {
    animate: { y: [0, -8, 0] },
    transition: { duration: 1, repeat: Infinity, ease: 'easeInOut' },
  },
  pensando: {
    animate: { y: [0, -10, 0] },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
  },
  celebrando: {
    animate: { scale: [1, 1.1, 0.95, 1.08, 1], rotate: [-5, 5, -5, 5, 0] },
    transition: { duration: 0.7, repeat: Infinity, ease: 'easeInOut' },
  },
  leyendo: {
    animate: { y: [0, -6, 0] },
    transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
  },
  triste: {
    animate: { rotate: [-5, 5, -5] },
    transition: { duration: 3.5, repeat: Infinity, ease: 'easeInOut' },
  },
  hablando: {
    animate: { y: [0, -6, 0] },
    transition: { duration: 1.8, repeat: Infinity, ease: 'easeInOut' },
  },
  sorprendido: {
    animate: { scale: [1, 1.12, 1] },
    transition: { duration: 0.35, repeat: Infinity, repeatDelay: 2.5, ease: 'easeOut' },
  },
}

// Dimensiones reales promedio de los PNG recortados (~465x507).
// Deben diferir de los valores CSS para que Next.js no emita el warning
// "has either width or height modified, but not the other".
const IMG_W = 465
const IMG_H = 507

export default function Ruty({ pose = 'neutral', size = 120, height, noAnim = false, className = '' }: RutyProps) {
  const [imgError, setImgError] = useState(false)
  const anim = poseAnimations[pose]

  // Cuando noAnim=true el motion.div queda fijo (sin loop)
  const animateVal = noAnim ? { scale: 1, y: 0, rotate: 0 } : anim.animate
  const transitionVal = noAnim ? { duration: 0 } : anim.transition

  // CSS controla el tamaño visual; width/height props de <Image> definen
  // las dimensiones intrinsecas (aspect-ratio para CLS) y deben ser distintos
  // a los valores CSS para evitar el warning de Next.js Image.
  const imageStyle = height
    ? { height, width: 'auto' as const }
    : { width: size, height: 'auto' as const }

  const containerStyle = height
    ? { height, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 as const }
    : { width: size, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 as const }

  return (
    <motion.div
      animate={animateVal}
      transition={transitionVal}
      className={className}
      style={containerStyle}
    >
      {imgError ? (
        <div
          style={height ? { width: height, height } : { width: size, height: size }}
          className="rounded-full bg-orange-100 border-2 border-orange-200 flex items-center justify-center"
        >
          <span className="text-orange-500 font-bold text-xs">Ruty</span>
        </div>
      ) : (
        <Image
          src={`/mascot/ruty-${pose}.png`}
          alt={`Ruty ${pose}`}
          width={IMG_W}
          height={IMG_H}
          style={imageStyle}
          className="drop-shadow-md"
          onError={() => setImgError(true)}
          priority={pose === 'neutral' || pose === 'pensando' || pose === 'celebrando' || pose === 'hablando'}
        />
      )}
    </motion.div>
  )
}
