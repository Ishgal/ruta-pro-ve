import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  const { courseId } = await params
  const { lessonId, answers } = await request.json()

  if (!lessonId || !answers) return NextResponse.json({ error: 'lessonId y answers requeridos' }, { status: 400 })

  const lesson = await prisma.lesson.findFirst({
    where: { id: lessonId, courseId },
    select: { id: true },
  })
  if (!lesson) return NextResponse.json({ error: 'Leccion no encontrada' }, { status: 404 })

  await prisma.userQuizResult.upsert({
    where: { userId_lessonId: { userId: user.id, lessonId } },
    create: { userId: user.id, lessonId, answers },
    update: { answers, submittedAt: new Date() },
  })

  return NextResponse.json({ ok: true })
}
