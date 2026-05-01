import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (dbUser?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const courses = await prisma.course.findMany({
    include: { level: true, lessons: { orderBy: { displayOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json(courses)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  if (dbUser?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { title, description, levelId, careers, duration, thumbnailUrl, skillsTags, isPublished } = await request.json()
  try {
    const course = await prisma.course.create({
      data: {
        title,
        description: description || null,
        levelId: Number(levelId),
        careers: careers ?? [],
        duration: duration || null,
        thumbnailUrl: thumbnailUrl || null,
        skillsTags: skillsTags ?? [],
        isPublished: isPublished ?? false,
      },
    })
    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al crear curso' }, { status: 500 })
  }
}
