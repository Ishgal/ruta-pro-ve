// app/api/admin/courses/[courseId]/lessons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';

// Helper seguro (sin any) para extraer courseId de params (Promise o síncrono)
async function extractCourseId(params: unknown): Promise<string | null> {
  try {
    // Normalizar: si es Promise, resolvemos
    const resolved = params instanceof Promise ? await params : params;
    
    // Verificar que es un objeto y tiene la propiedad 'courseId' como string
    if (resolved && typeof resolved === 'object') {
      const maybeId = (resolved as Record<string, unknown>).courseId;
      if (typeof maybeId === 'string' && maybeId.length > 0) {
        return maybeId;
      }
    }
    return null;
  } catch (error) {
    console.error('Error al extraer courseId:', error);
    return null;
  }
}

// GET: Listar lecciones
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> | { courseId: string } }
) {
  const courseId = await extractCourseId(params);
  if (!courseId) {
    return NextResponse.json({ error: 'ID del curso no válido' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (dbUser?.role !== 'admin') {
    return NextResponse.json({ error: 'Requiere rol admin' }, { status: 403 });
  }

  const lessons = await prisma.lesson.findMany({
    where: { courseId },
    orderBy: { displayOrder: 'asc' },
  });
  return NextResponse.json(lessons);
}

// POST: Crear una nueva lección
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ courseId: string }> | { courseId: string } }
) {
  const courseId = await extractCourseId(params);
  if (!courseId) {
    return NextResponse.json({ error: 'ID del curso no válido' }, { status: 400 });
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { role: true } });
  if (dbUser?.role !== 'admin') {
    return NextResponse.json({ error: 'Requiere rol admin' }, { status: 403 });
  }

  const body = await req.json();
  const { title, videoUrl, content, displayOrder, duration, isFreePreview } = body;

  if (!title) {
    return NextResponse.json({ error: 'El título es requerido' }, { status: 400 });
  }

  try {
    const lesson = await prisma.lesson.create({
      data: {
        courseId,
        title,
        videoUrl: videoUrl ?? null,
        content: content ?? null,
        displayOrder: Number(displayOrder ?? 0),
        duration: duration ?? null,
        isFreePreview: isFreePreview ?? false,
      },
    });
    return NextResponse.json(lesson, { status: 201 });
  } catch (error) {
    console.error('Error al crear lección:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}