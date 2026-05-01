import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import OnboardingWizard from '@/components/onboarding/OnboardingWizard'

export default async function OnboardingPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true, name: true, studentProfile: { select: { completedAt: true } } },
  })

  if (!dbUser || dbUser.role !== 'estudiante') redirect('/dashboard')
  if (dbUser.studentProfile?.completedAt) redirect('/dashboard')

  return <OnboardingWizard userName={dbUser.name} />
}
