import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { PrismaUserRepository } from '@/adapters/repositories/prisma-user.repository';
import { GetUserRoleUseCase } from '@/application/use-cases/user/get-user-role.usecase';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role = await new GetUserRoleUseCase(new PrismaUserRepository()).execute(user.id);
  return role === 'admin' ? user : null;
}

// GET: Obtener cursos asignados y no asignados a un profesor
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  
  const { id: teacherId } = await context.params;

  // Obtener cursos asignados actualmente
  const assignedCourses = await prisma.teacherAssignment.findMany({
    where: { teacherId: teacherId, isActive: true },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          isPublished: true,
          level: { select: { name: true } }
        }
      }
    }
  });

  // Obtener todos los cursos publicados
  const allCourses = await prisma.course.findMany({
    where: { isPublished: true },
    select: {
      id: true,
      title: true,
      isPublished: true,
      level: { select: { name: true } }
    },
    orderBy: { title: 'asc' }
  });

  // Filtrar cursos no asignados
  const assignedIds = new Set(assignedCourses.map(a => a.courseId));
  const unassignedCourses = allCourses.filter(c => !assignedIds.has(c.id));

  return NextResponse.json({
    assigned: assignedCourses.map(a => a.course),
    unassigned: unassignedCourses
  });
}

// POST: Asignar profesor a un curso
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  
  const { id: teacherId } = await context.params;
  const { courseId } = await req.json();

  if (!courseId) {
    return NextResponse.json({ error: 'courseId es requerido' }, { status: 400 });
  }

  // Verificar si ya está asignado
  const existing = await prisma.teacherAssignment.findFirst({
    where: { teacherId, courseId, isActive: true }
  });

  if (existing) {
    return NextResponse.json({ error: 'El profesor ya está asignado a este curso' }, { status: 409 });
  }

  // Crear la asignación
  const assignment = await prisma.teacherAssignment.create({
    data: {
      teacherId,
      courseId,
      isActive: true,
      assignedAt: new Date()
    },
    include: {
      course: {
        select: { id: true, title: true, isPublished: true }
      }
    }
  });

  return NextResponse.json(assignment, { status: 201 });
}

// DELETE: Desasignar profesor de un curso
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  
  const { id: teacherId } = await context.params;
  const url = new URL(req.url);
  const courseId = url.searchParams.get('courseId');

  if (!courseId) {
    return NextResponse.json({ error: 'courseId es requerido' }, { status: 400 });
  }

  // Eliminar la asignación
  await prisma.teacherAssignment.deleteMany({
    where: { teacherId, courseId }
  });

  return NextResponse.json({ success: true });
}