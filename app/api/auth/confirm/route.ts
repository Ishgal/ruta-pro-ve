// app/api/auth/confirm/route.ts
import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null
  const next = searchParams.get('next') ?? '/dashboard'

  if (token_hash && type) {
    const supabase = await createClient()
    const { error } = await supabase.auth.verifyOtp({ type, token_hash })

    if (!error) {
      // Obtener el usuario autenticado después de verificar
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        // Buscar el rol del usuario en la base de datos
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true }
        })
        
        // Redirigir según el rol
        if (dbUser?.role === 'admin') {
          return NextResponse.redirect(new URL('/admin', request.url))
        } else if (dbUser?.role === 'docente') {
          return NextResponse.redirect(new URL('/teacher-dashboard', request.url))
        }
      }
      
      // Si no se pudo determinar el rol, usar el next original
      return NextResponse.redirect(new URL(next, request.url))
    }
  }

  return NextResponse.redirect(
    new URL('/login?error=El+enlace+de+verificaci%C3%B3n+es+inv%C3%A1lido+o+expiró', request.url)
  )
}