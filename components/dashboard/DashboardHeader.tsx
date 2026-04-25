interface DashboardHeaderProps {
  greeting?: string
}

export default function DashboardHeader({ greeting = '¡Hola, Estudiante!' }: DashboardHeaderProps) {
  return (
    <header className="flex items-center justify-between px-5 py-4 bg-[#F4F6F9] md:bg-transparent">
      {/* Avatar + greeting */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#00B5B5]/20 flex items-center justify-center shrink-0 overflow-hidden">
          <svg className="w-5 h-5 text-[#00B5B5]" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
          </svg>
        </div>
        <span className="font-semibold text-gray-800 text-sm md:text-base">{greeting}</span>
      </div>

      {/* Bell */}
      <button
        aria-label="Notificaciones"
        className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-gray-200/60 transition-colors duration-150 relative"
      >
        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#00B5B5] rounded-full" />
      </button>
    </header>
  )
}
