import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const { pathname } = request.nextUrl

  // Rutas públicas (añadimos /auth/set-password)
  const publicRoutes = ['/login', '/register', '/auth/set-password']
  const isPublicRoute = publicRoutes.some(route => pathname === route)

  // Si no hay usuario y la ruta es protegida, redirigir a login
  if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/admin')) && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Si hay usuario y está en login o register, redirigir a dashboard
  if (user && (pathname === '/login' || pathname === '/register')) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/dashboard/:path*', 
    '/admin/:path*', 
    '/auth/set-password',  // ← Añadimos esta línea
    '/login', 
    '/register'
  ],
}