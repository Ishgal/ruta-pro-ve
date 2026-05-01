import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  return dbUser?.role === 'admin' ? user : null
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { courseId } = await params
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { level: true, lessons: { orderBy: { displayOrder: 'asc' } } },
  })
  if (!course) return NextResponse.json({ error: 'Curso no encontrado' }, { status: 404 })
  return NextResponse.json(course)
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { courseId } = await params
  const { title, description, levelId, careers, duration, thumbnailUrl, skillsTags, isPublished } = await req.json()

  try {
    const course = await prisma.course.update({
      where: { id: courseId },
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
    return NextResponse.json(course)
  } catch {
    return NextResponse.json({ error: 'Error al actualizar el curso' }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ courseId: string }> }) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { courseId } = await params
  try {
    await prisma.lesson.deleteMany({ where: { courseId } })
    await prisma.course.delete({ where: { id: courseId } })
    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Error al eliminar el curso' }, { status: 500 })
  }
}
