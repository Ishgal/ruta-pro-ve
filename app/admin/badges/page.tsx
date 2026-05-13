import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import BadgesClient from '@/components/admin/badges/BadgesClient'

export default async function BadgesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    select: { role: true }
  })
  if (dbUser?.role !== 'admin') redirect('/dashboard')

  const badges = await prisma.badge.findMany({
    orderBy: [{ conditionType: 'asc' }, { conditionValue: 'asc' }],
    include: { _count: { select: { userBadges: true } } }
  })

  return <BadgesClient badges={badges} />
}
