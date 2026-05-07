// app/api/auth/me/route.ts
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { NextResponse } from 'next/server';

// Cambiar de GET a POST o mantener GET pero permitir HEAD
export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autenticado' }, { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, name: true, email: true, role: true }
    });

    return NextResponse.json({
      id: dbUser?.id,
      name: dbUser?.name,
      email: dbUser?.email,
      role: dbUser?.role,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ error: 'Error interno' }, { status: 500 });
  }
}

// Agregar soporte para HEAD requests
export async function HEAD() {
  return GET();
}