import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

async function extractLessonId(params: unknown): Promise<string | null> {
  try {
    let resolved: unknown = params;
    if (params instanceof Promise) {
      resolved = await params;
    }
    if (resolved && typeof resolved === 'object' && 'lessonId' in resolved) {
      const id = (resolved as { lessonId?: unknown }).lessonId;
      return typeof id === 'string' ? id : null;
    }
    return null;
  } catch {
    return null;
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> | { lessonId: string } }
) {
  const lessonId = await extractLessonId(params);
  if (!lessonId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (dbUser?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { title, videoUrl, content, displayOrder, duration, isFreePreview } = body;

  const updated = await prisma.lesson.update({
    where: { id: lessonId },
    data: {
      title,
      videoUrl: videoUrl ?? null,
      content: content ?? null,
      displayOrder: Number(displayOrder ?? 0),
      duration: duration ?? null,
      isFreePreview: isFreePreview ?? false,
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ lessonId: string }> | { lessonId: string } }
) {
  const lessonId = await extractLessonId(params);
  if (!lessonId) return NextResponse.json({ error: 'ID inválido' }, { status: 400 });

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (dbUser?.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  await prisma.lesson.delete({ where: { id: lessonId } });
  return NextResponse.json({ success: true });
}