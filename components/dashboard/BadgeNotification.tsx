'use client'

import { useEffect, useState } from 'react'

type EarnedBadge = { name: string; icon: string; description: string }

type Props = {
  badges: EarnedBadge[]
  onClose: () => void
}

export default function BadgeNotification({ badges, onClose }: Props) {
  const [visible, setVisible] = useState(false)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    // Slight delay so the entrance animation is visible
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  function dismiss() {
    if (index < badges.length - 1) {
      setIndex(i => i + 1)
    } else {
      setVisible(false)
      setTimeout(onClose, 300)
    }
  }

  const badge = badges[index]
  if (!badge) return null

  const isEmoji = badge.icon && !badge.icon.startsWith('/')
  const icon = isEmoji ? badge.icon : '🏅'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
      <div
        className={`relative w-full max-w-xs bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-300 ${
          visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'
        }`}
      >
        {/* Top accent */}
        <div className="h-1.5 bg-gradient-to-r from-[#1B4F8C] to-[#00B5B5]" />

        <div className="px-6 pt-8 pb-6 flex flex-col items-center text-center gap-4">
          {/* Badge count indicator */}
          {badges.length > 1 && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">
              {index + 1} / {badges.length}
            </p>
          )}

          {/* Icon */}
          <div className="w-24 h-24 rounded-3xl bg-amber-50 flex items-center justify-center text-5xl shadow-sm">
            {icon}
          </div>

          {/* Labels */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#00B5B5] mb-1">
              Logro desbloqueado
            </p>
            <h3 className="text-2xl font-black text-[#0D2040]">{badge.name}</h3>
            {badge.description && (
              <p className="text-sm text-gray-500 mt-1.5 leading-snug">{badge.description}</p>
            )}
          </div>

          {/* CTA */}
          <button
            onClick={dismiss}
            className="mt-2 w-full py-3 rounded-2xl bg-[#1B4F8C] text-white font-bold text-sm hover:bg-[#163e6e] transition-colors"
          >
            {index < badges.length - 1 ? 'Siguiente logro' : '¡Genial!'}
          </button>
        </div>
      </div>
    </div>
  )
}
