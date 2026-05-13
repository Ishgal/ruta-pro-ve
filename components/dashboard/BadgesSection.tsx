'use client'

import { useState } from 'react'

type Badge = {
  id: string
  badge: { name: string; iconUrl: string | null; description: string | null }
}

const PREVIEW_COUNT = 4

export default function BadgesSection({ badges }: { badges: Badge[] }) {
  const [showModal, setShowModal] = useState(false)

  const preview = badges.slice(0, PREVIEW_COUNT)

  return (
    <>
      <div className="bg-white rounded-2xl p-5 shadow-sm flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-gray-900">Insignias Logradas</h2>
          {badges.length > PREVIEW_COUNT && (
            <button
              onClick={() => setShowModal(true)}
              className="text-sm text-[#00B5B5] font-semibold hover:underline"
            >
              Ver todos
            </button>
          )}
        </div>

        {badges.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-gray-300 flex-1">
            <svg className="w-10 h-10 mb-2" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.562.562 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z" />
            </svg>
            <p className="text-sm font-medium text-gray-400">Aun sin insignias</p>
            <p className="text-xs text-gray-300 mt-1">Completa cursos para ganarlas</p>
          </div>
        ) : (
          <div className="flex gap-5 flex-wrap">
            {preview.map((ub) => (
              <div key={ub.id} className="flex flex-col items-center gap-2">
                <div className="w-14 h-14 rounded-full bg-[#E6F8F8] flex items-center justify-center">
                  <span className="text-3xl">{ub.badge.iconUrl ?? '🏅'}</span>
                </div>
                <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-600 text-center max-w-[70px]">
                  {ub.badge.name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-900">Todas las insignias</h3>
              <button
                onClick={() => setShowModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
              >
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-4 flex flex-col gap-3">
              {badges.map((ub) => (
                <div key={ub.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50">
                  <div className="w-12 h-12 rounded-full bg-[#E6F8F8] flex items-center justify-center shrink-0">
                    <span className="text-2xl">{ub.badge.iconUrl ?? '🏅'}</span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-gray-800">{ub.badge.name}</p>
                    {ub.badge.description && (
                      <p className="text-xs text-gray-500 mt-0.5 leading-snug">{ub.badge.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
