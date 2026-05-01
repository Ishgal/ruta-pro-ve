import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, studentProfile: { select: { completedAt: true } } },
  })

  if (!dbUser) redirect('/login')

  if (dbUser.role === 'estudiante' && !dbUser.studentProfile?.completedAt) {
    redirect('/onboarding')
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F6F9]">
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-24 md:pb-0">
        {children}
      </main>
      <BottomNav />
    </div>
  )
}
