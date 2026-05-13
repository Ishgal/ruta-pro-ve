import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (user) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })
    if (dbUser?.role === 'admin') redirect('/admin')
    if (dbUser?.role === 'docente') redirect('/teacher-dashboard')
    if (dbUser?.role === 'estudiante') redirect('/dashboard')
  }

  return <>{children}</>
}
