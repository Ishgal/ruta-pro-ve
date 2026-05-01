import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { createClient } from '@/lib/supabase/server'
import { LessonType } from '@/app/generated/prisma'

async function requireAdmin() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } })
  return dbUser?.role === 'admin' ? user : null
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { lessonId } = await params
  const lesson = await prisma.lesson.findUnique({ where: { id: lessonId } })
  if (!lesson) return NextResponse.json({ error: 'Leccion no encontrada' }, { status: 404 })
  return NextResponse.json(lesson)
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { lessonId } = await params
  const body = await req.json()
  const { title, videoUrl, content, slidesUrl, displayOrder, duration, isFreePreview, lessonType, quizData } = body

  const order = Number(displayOrder ?? 0)
  const current = await prisma.lesson.findUnique({ where: { id: lessonId }, select: { courseId: true } })
  if (current) {
    const orderConflict = await prisma.lesson.findFirst({
      where: { courseId: current.courseId, displayOrder: order, id: { not: lessonId } },
      select: { id: true },
    })
    if (orderConflict) {
      return NextResponse.json(
        { error: `Ya existe una leccion con el orden ${order}. Usa otro numero.` },
        { status: 409 }
      )
    }
  }

  const updated = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title,
      videoUrl: videoUrl || null,
      content: content || null,
      slidesUrl: slidesUrl || null,
      displayOrder: order,
      duration: duration || null,
      isFreePreview: isFreePreview ?? false,
      lessonType: (lessonType as LessonType) ?? LessonType.video,
      quizData: quizData ?? null,
    },
  })
  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { lessonId } = await params
  await prisma.lesson.delete({ where: { id: lessonId } })
  return NextResponse.json({ success: true })
}
