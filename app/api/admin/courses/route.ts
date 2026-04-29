// app/api/admin/courses/route.ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server' // <-- tu función

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })
  if (dbUser?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const courses = await prisma.course.findMany({
    include: { level: true, lessons: { orderBy: { displayOrder: 'asc' } } },
    orderBy: { createdAt: 'desc' }
  })
  return NextResponse.json(courses)
}

export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true }
  })
  if (dbUser?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await request.json()
  const { title, description, levelId, isRequired, duration, thumbnailUrl, skillsTags, isPublished } = body
  try {
    const course = await prisma.course.create({
      data: {
        title,
        description,
        levelId: Number(levelId),
        isRequired: isRequired ?? true,
        duration: duration || null,
        thumbnailUrl: thumbnailUrl || null,
        skillsTags: skillsTags || [],
        isPublished: isPublished ?? false,
      }
    })
    return NextResponse.json(course, { status: 201 })
  } catch (error) {
    console.error(error) // <-- elimina advertencia ESLint
    return NextResponse.json({ error: 'Error al crear curso' }, { status: 500 })
  }
}