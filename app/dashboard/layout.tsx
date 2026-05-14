import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import Sidebar from '@/components/dashboard/Sidebar'
import BottomNav from '@/components/dashboard/BottomNav'
import PageTransition from '@/components/ui/PageTransition'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, plan: true, studentProfile: { select: { completedAt: true } } },
  })

  if (!dbUser) redirect('/login')

  if (dbUser.role === 'admin') redirect('/admin')
  if (dbUser.role === 'docente') redirect('/teacher-dashboard')

  if (dbUser.role === 'estudiante' && !dbUser.studentProfile?.completedAt) {
    redirect('/onboarding')
  }

  const isOro = dbUser.plan === 'oro'

  return (
    <div className="flex h-screen overflow-hidden bg-[#F4F6F9]">
      <Sidebar isOro={isOro} plan={dbUser.plan ?? 'bronce'} />
      <main className="flex-1 overflow-y-auto overflow-x-hidden pb-24 md:pb-0">
        <PageTransition>{children}</PageTransition>
      </main>
      <BottomNav isOro={isOro} />
    </div>
  )
}
