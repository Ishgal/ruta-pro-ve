// app/api/teachers/[id]/rating/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const { id: teacherId } = await context.params;
    const { courseId, rating, comment } = await req.json();

    if (!courseId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 });
    }

    // Verificar plan Oro
    const student = await prisma.user.findUnique({
      where: { id: user.id },
      select: { plan: true },
    });
    if (student?.plan !== 'oro') {
      return NextResponse.json({ error: 'Calificar docentes requiere plan Oro' }, { status: 403 });
    }

    // Verificar que el estudiante completó el curso
    const progress = await prisma.userCourseProgress.findFirst({
      where: {
        userId: user.id,
        courseId: courseId,
        status: 'completed'
      }
    });
    if (!progress) {
      return NextResponse.json({ error: 'Debes completar el curso primero' }, { status: 403 });
    }

    // Verificar que el profesor está asignado al curso
    const assignment = await prisma.teacherAssignment.findFirst({
      where: {
        teacherId: teacherId,
        courseId: courseId,
        isActive: true
      }
    });
    if (!assignment) {
      return NextResponse.json({ error: 'Este profesor no está asignado al curso' }, { status: 403 });
    }

    // Crear o actualizar reseña usando el modelo TeacherReview
    await prisma.teacherReview.upsert({
      where: {
        teacherId_studentId_courseId: {
          teacherId: teacherId,
          studentId: user.id,
          courseId: courseId
        }
      },
      update: { rating, comment },
      create: {
        teacherId: teacherId,
        studentId: user.id,
        courseId: courseId,
        rating,
        comment
      }
    });

    // Recalcular promedio del profesor
    const avg = await prisma.teacherReview.aggregate({
      where: { teacherId: teacherId },
      _avg: { rating: true }
    });
    const newRating = avg._avg.rating ?? 0;

    // Actualizar el campo rating en Teacher
    await prisma.teacher.update({
      where: { id: teacherId },
      data: { rating: newRating }
    });

    return NextResponse.json({ success: true, rating: newRating });
  } catch (error) {
    console.error('Error al calificar profesor:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}