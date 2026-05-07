import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'
import TeachersClient, { TeacherWithRating } from '@/components/admin/teachers/TeachersClient'

export default async function TeachersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { email: user.email! },
    select: { role: true }
  })
  if (dbUser?.role !== 'admin') redirect('/dashboard')

  const teachers = await prisma.user.findMany({
    where: { role: 'docente' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      plan: true,
      isActive: true,
      setupStatus: true,
      createdAt: true,
      teacherProfile: {
        select: {
          rating: true,
          assignments: {
            where: { isActive: true },
            select: {
              course: {
                select: { id: true, title: true, isPublished: true }
              }
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  })

  const teachersWithData: TeacherWithRating[] = teachers.map(teacher => ({
    id: teacher.id,
    name: teacher.name ?? '',
    email: teacher.email,
    role: teacher.role,
    plan: teacher.plan,
    isActive: teacher.isActive,
    setupStatus: teacher.setupStatus,
    createdAt: teacher.createdAt,
    rating: teacher.teacherProfile?.rating ?? 0,
    courses: teacher.teacherProfile?.assignments.map(ass => ({
      id: ass.course.id,
      title: ass.course.title,
      isPublished: ass.course.isPublished
    })) ?? []
  }))

  return <TeachersClient initialTeachers={teachersWithData} />
}