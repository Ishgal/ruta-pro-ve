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
  { params }: { params: Promise<{ courseId: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { courseId } = await params
  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    orderBy: { displayOrder: 'asc' },
  })
  return NextResponse.json(lessons)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const { courseId } = await params
  const body = await req.json()
  const { title, videoUrl, content, slidesUrl, displayOrder, duration, isFreePreview, lessonType, quizData } = body

  if (!title) return NextResponse.json({ error: 'El titulo es requerido' }, { status: 400 })

  const order = Number(displayOrder ?? 0)
  const orderConflict = await prisma.lesson.findFirst({
    where: { courseId, displayOrder: order },
    select: { id: true },
  })
  if (orderConflict) {
    return NextResponse.json(
      { error: `Ya existe una leccion con el orden ${order}. Usa otro numero.` },
      { status: 409 }
    )
  }

  const lesson = await prisma.lesson.create({
    data: {
      courseId,
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
  return NextResponse.json(lesson, { status: 201 })
}
