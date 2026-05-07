import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';
import { PrismaUserRepository } from '@/adapters/repositories/prisma-user.repository';
import { GetUserRoleUseCase } from '@/application/use-cases/user/get-user-role.usecase';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { randomBytes } from 'crypto';

interface PrismaError {
  code?: string;
  message?: string;
}

async function requireAdmin() {
  try {
    const supabase = await createClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      console.error('Error en requireAdmin - getUser:', error);
      return null;
    }
    const role = await new GetUserRoleUseCase(new PrismaUserRepository()).execute(user.id);
    return role === 'admin' ? user : null;
  } catch (error) {
    console.error('Error en requireAdmin:', error);
    return null;
  }
}

export async function GET() {
  try {
    const admin = await requireAdmin();
    if (!admin) {
      console.error('GET /api/admin/teachers - No autorizado');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const teachers = await prisma.user.findMany({
      where: { role: 'docente' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        setupStatus: true,
        createdAt: true,
        teacherProfile: {
          select: {
            rating: true,
            specialty: true,
            studentsLimit: true,
            bio: true,
            hourlyRate: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const teachersWithRating = teachers.map(teacher => ({
      ...teacher,
      rating: teacher.teacherProfile?.rating || 0,
      specialty: teacher.teacherProfile?.specialty || [],
      studentsLimit: teacher.teacherProfile?.studentsLimit,
      bio: teacher.teacherProfile?.bio,
      hourlyRate: teacher.teacherProfile?.hourlyRate,
      teacherProfile: undefined
    }));

    return NextResponse.json(teachersWithRating);
  } catch (error) {
    console.error('GET /api/admin/teachers - Error:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 POST /api/admin/teachers - Iniciando...');
    
    const admin = await requireAdmin();
    if (!admin) {
      console.error('❌ POST - No autorizado');
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { email, name } = await request.json();
    console.log(`📧 Creando docente: email=${email}, name=${name}`);

    if (!email || !name) {
      console.error('❌ POST - Email o nombre faltante');
      return NextResponse.json({ error: 'Email y nombre son requeridos' }, { status: 400 });
    }

    // Crear cliente de Supabase con la Service Role Key
    console.log('🔑 Creando cliente Supabase Admin...');
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    let userId: string | null = null;
    let isExistingAuthUser = false;

    try {
      console.log('🔍 Buscando usuario en Supabase...');
      const { data: { users }, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (listError) {
        console.error('❌ Error al listar usuarios:', listError);
        return NextResponse.json(
          { error: `Error al listar usuarios: ${listError.message}` },
          { status: 500 }
        );
      }
      
      const existingAuthUser = users.find(u => u.email === email);
      
      if (existingAuthUser) {
        userId = existingAuthUser.id;
        isExistingAuthUser = true;
        console.log('✅ Usuario YA EXISTE en Supabase, ID:', userId);
      } else {
        console.log('👤 Usuario NO existe, creando nuevo...');
        const temporaryPassword = randomBytes(10).toString('hex');
        
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: email,
          password: temporaryPassword,
          email_confirm: false,
          user_metadata: {
            name: name,
            role: 'docente'
          }
        });

        if (createError) {
          console.error('❌ Error al crear usuario:', createError);
          return NextResponse.json(
            { error: `No se pudo crear el docente: ${createError.message}` },
            { status: 400 }
          );
        }

        if (!newUser?.user) {
          console.error('❌ No se recibió usuario de Supabase');
          return NextResponse.json(
            { error: 'No se pudo crear el docente en Supabase.' },
            { status: 400 }
          );
        }
        
        userId = newUser.user.id;
        console.log('✅ Usuario CREADO en Supabase, ID:', userId);
      }
    } catch (error) {
      console.error('❌ Error en operación de Supabase:', error);
      return NextResponse.json(
        { error: 'Error al comunicarse con Supabase.' },
        { status: 500 }
      );
    }

    if (!userId) {
      console.error('❌ No se pudo obtener ID de usuario');
      return NextResponse.json(
        { error: 'No se pudo obtener un ID de usuario.' },
        { status: 500 }
      );
    }

    // Verificar si el usuario ya existe en Prisma
    console.log('💾 Verificando existencia en Prisma...');
    const existingPrismaUser = await prisma.user.findUnique({
      where: { id: userId }
    });

    let newTeacher;
    
    if (existingPrismaUser) {
      console.log('📝 Usuario ya existe en Prisma, actualizando rol a docente...');
      // IMPORTANTE: Actualizar el rol a 'docente'
      newTeacher = await prisma.user.update({
        where: { id: userId },
        data: { 
          role: 'docente',
          name: name // También actualizamos el nombre por si acaso
        }
      });
      
      // Verificar si tiene perfil de Teacher
      const existingTeacherProfile = await prisma.teacher.findUnique({
        where: { id: userId }
      });
      
      if (!existingTeacherProfile) {
        console.log('👨‍🏫 Creando perfil de Teacher (no existía)...');
        await prisma.teacher.create({
          data: {
            id: userId,
            specialty: []
          }
        });
      }
    } else {
      console.log('➕ Creando usuario en Prisma con rol DOCENTE...');
      // IMPORTANTE: Crear con role = 'docente'
      newTeacher = await prisma.user.create({
        data: {
          id: userId,
          email: email,
          name: name,
          role: 'docente', // ← FORZAR rol docente
          setupStatus: 'pending',
          isActive: true
        }
      });
      console.log('✅ Usuario DOCENTE creado en Prisma, ID:', newTeacher.id);

      console.log('👨‍🏫 Creando perfil de Teacher...');
      await prisma.teacher.create({
        data: {
          id: newTeacher.id,
          specialty: []
        }
      });
      console.log('✅ Perfil de Teacher creado');
    }

    // Generar el enlace de invitación
    console.log('🔗 Generando enlace de invitación...');
    
    let inviteLink: string;
    
    if (isExistingAuthUser) {
      const { data: recoveryData, error: recoveryError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'recovery',
        email: email,
        options: {
          redirectTo: `${request.nextUrl.origin}/auth/set-password`
        }
      });

      if (recoveryError) {
        console.error('❌ Error al generar enlace de recuperación:', recoveryError);
        return NextResponse.json(
          { error: `Error al generar el enlace: ${recoveryError.message}` },
          { status: 500 }
        );
      }
      
      const supabaseUrl = recoveryData.properties?.action_link;
      if (supabaseUrl) {
        const urlParams = new URL(supabaseUrl);
        const tokenParam = urlParams.searchParams.get('token');
        inviteLink = tokenParam 
          ? `${request.nextUrl.origin}/auth/set-password?token=${tokenParam}`
          : supabaseUrl;
      } else {
        inviteLink = `${request.nextUrl.origin}/auth/set-password?error=no-link`;
      }
    } else {
      const { data: inviteData, error: inviteError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'invite',
        email: email,
        options: {
          redirectTo: `${request.nextUrl.origin}/auth/set-password`
        }
      });

      if (inviteError) {
        console.error('❌ Error al generar enlace de invitación:', inviteError);
        return NextResponse.json(
          { error: `Error al generar el enlace: ${inviteError.message}` },
          { status: 500 }
        );
      }
      
      const supabaseUrl = inviteData.properties?.action_link;
      if (supabaseUrl) {
        const urlParams = new URL(supabaseUrl);
        const tokenParam = urlParams.searchParams.get('token');
        inviteLink = tokenParam 
          ? `${request.nextUrl.origin}/auth/set-password?token=${tokenParam}`
          : supabaseUrl;
      } else {
        inviteLink = `${request.nextUrl.origin}/auth/set-password?error=no-link`;
      }
    }

    console.log('🔗 Enlace generado:', inviteLink);
    console.log('✅ Rol asignado: docente');

    return NextResponse.json({
      id: newTeacher.id,
      email: newTeacher.email,
      inviteLink: inviteLink,
      role: 'docente',
      message: isExistingAuthUser 
        ? 'Docente actualizado exitosamente. Comparte el siguiente enlace para que restablezca su contraseña.'
        : 'Docente creado exitosamente. Comparte el siguiente enlace para que establezca su contraseña.'
    }, { status: 201 });
    
  } catch (dbError: unknown) {
    console.error('❌ Error general:', dbError);
    const prismaError = dbError as PrismaError;
    
    if (prismaError.code === 'P2002') {
      return NextResponse.json(
        { error: 'Conflicto al crear el usuario. Por favor, intenta de nuevo.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: `Error al guardar el docente: ${prismaError.message || 'Error desconocido'}` },
      { status: 500 }
    );
  }
}