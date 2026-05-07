'use server';

import { createClient } from '@/lib/supabase/server';
import { prisma } from '@/lib/prisma';

interface SetPasswordState {
  error?: string;
  success?: boolean;
}

export async function setPasswordAction(
  prevState: SetPasswordState,
  formData: FormData
): Promise<SetPasswordState> {
  const token = formData.get('token') as string;
  const password = formData.get('password') as string;
  const confirm = formData.get('confirm') as string;

  console.log('🔍 [setPasswordAction] Iniciando proceso...');
  console.log('📝 Token recibido:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN');
  console.log('📝 Password length:', password?.length || 0);

  if (!token) {
    console.error('❌ [setPasswordAction] No se recibió token');
    return { error: 'Enlace inválido o expirado' };
  }

  if (!password || password.length < 6) {
    console.error('❌ [setPasswordAction] Contraseña inválida');
    return { error: 'La contraseña debe tener al menos 6 caracteres' };
  }

  if (password !== confirm) {
    console.error('❌ [setPasswordAction] Las contraseñas no coinciden');
    return { error: 'Las contraseñas no coinciden' };
  }

  try {
    const supabase = await createClient();

    console.log('🔍 [setPasswordAction] Verificando token con Supabase...');
    
    // Verificar el token de invitación
    const { data: verifyData, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: 'invite',
    });

    if (verifyError) {
      console.error('❌ [setPasswordAction] Error al verificar token:', verifyError);
      console.error('Detalles del error:', JSON.stringify(verifyError, null, 2));
      return { error: verifyError.message || 'Enlace inválido o expirado' };
    }

    if (!verifyData.user) {
      console.error('❌ [setPasswordAction] No se encontró usuario para el token');
      return { error: 'Enlace inválido o expirado' };
    }

    console.log('✅ [setPasswordAction] Token verificado. Usuario:', verifyData.user.email);

    // Actualizar la contraseña del usuario
    console.log('🔍 [setPasswordAction] Actualizando contraseña...');
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    });

    if (updateError) {
      console.error('❌ [setPasswordAction] Error al actualizar contraseña:', updateError);
      return { error: 'Error al establecer la contraseña' };
    }

    console.log('✅ [setPasswordAction] Contraseña actualizada correctamente');

    // Actualizar el estado en Prisma (de pending a active)
    console.log('🔍 [setPasswordAction] Actualizando setupStatus en Prisma...');
    await prisma.user.update({
      where: { email: verifyData.user.email! },
      data: { setupStatus: 'active' }
    });

    console.log('✅ [setPasswordAction] setupStatus actualizado a active');

    // Iniciar sesión automáticamente
    console.log('🔍 [setPasswordAction] Iniciando sesión automática...');
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: verifyData.user.email!,
      password: password,
    });

    if (signInError) {
      console.error('⚠️ [setPasswordAction] Error al iniciar sesión automática:', signInError);
      // No es crítico, el usuario puede iniciar sesión manualmente
    } else {
      console.log('✅ [setPasswordAction] Sesión iniciada automáticamente');
    }

    console.log('🎉 [setPasswordAction] Proceso completado con éxito');
    return { success: true };
  } catch (error) {
    console.error('❌ [setPasswordAction] Error inesperado:', error);
    return { error: 'Error interno del servidor' };
  }
}