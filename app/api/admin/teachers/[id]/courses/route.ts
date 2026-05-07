import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@/lib/supabase/server';
import { GetUserRoleUseCase } from '@/application/use-cases/user/get-user-role.usecase';
import { PrismaUserRepository } from '@/adapters/repositories/prisma-user.repository';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;
  const role = await new GetUserRoleUseCase(new PrismaUserRepository()).execute(user.id);
  return role === 'admin' ? user : null;
}

// GET: cursos asignados a un profesor
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await context.params;

  const assignments = await prisma.teacherAssignment.findMany({
    where: { teacherId: id, isActive: true },
    include: { course: { select: { id: true, title: true, isPublished: true } } }
  });
  return NextResponse.json(assignments.map(a => a.course));
}

// POST: asignar profesor a un curso
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await context.params;
  const { courseId } = await req.json();

  if (!courseId) return NextResponse.json({ error: 'courseId requerido' }, { status: 400 });

  const existing = await prisma.teacherAssignment.findFirst({
    where: { teacherId: id, courseId, isActive: true }
  });
  if (existing) return NextResponse.json({ error: 'Ya está asignado' }, { status: 409 });

  const assignment = await prisma.teacherAssignment.create({
    data: { teacherId: id, courseId, isActive: true }
  });
  return NextResponse.json(assignment, { status: 201 });
}

// DELETE: desasignar profesor de un curso
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  const { id } = await context.params;
  const url = new URL(req.url);
  const courseId = url.searchParams.get('courseId');
  if (!courseId) return NextResponse.json({ error: 'courseId requerido' }, { status: 400 });

  await prisma.teacherAssignment.deleteMany({
    where: { teacherId: id, courseId }
  });
  return NextResponse.json({ success: true });
}