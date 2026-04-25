import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F4F6F9]">
      <Sidebar />
      <main className="flex-1 pb-24 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
