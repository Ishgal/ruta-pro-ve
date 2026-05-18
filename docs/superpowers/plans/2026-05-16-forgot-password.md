# Forgot Password Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implementar el flujo completo de recuperación de contraseña — formulario de email, envío de correo via Supabase, callback de token, y formulario de nueva contraseña.

**Architecture:** Se sigue estrictamente Clean Architecture del proyecto. El envío del correo de reset pasa por Port → Repository → UseCase → ServerAction. El update de contraseña sigue el patrón existente en `set-password.actions.ts` (llamada directa a Supabase dentro del server action, con validación en use case). El callback de token es un Client Component que usa el browser Supabase client para intercambiar el code PKCE, idéntico al patrón de `invite-callback/page.tsx`.

**Tech Stack:** Next.js 15 App Router, Supabase SSR (@supabase/ssr), React `useActionState`, TypeScript, Tailwind CSS

---

## Configuración previa requerida (Supabase Dashboard)

Antes de testear el flujo completo, agregar estas URLs al allowlist en Supabase Dashboard → Authentication → URL Configuration → Redirect URLs:
- `http://localhost:3000/auth/reset-callback`
- `https://<tu-dominio-de-produccion>/auth/reset-callback`

---

## Mapa de archivos

| Acción | Archivo | Responsabilidad |
|--------|---------|-----------------|
| Modificar | `application/ports/auth.repository.port.ts` | Agregar `requestPasswordReset` al port |
| Modificar | `adapters/repositories/supabase-auth.repository.ts` | Implementar `requestPasswordReset` |
| Crear | `application/use-cases/auth/request-password-reset.usecase.ts` | Validar email, delegar al repo |
| Crear | `app/actions/forgot-password.actions.ts` | Server action para enviar correo de reset |
| Crear | `app/(auth)/forgot-password/page.tsx` | Page wrapper con Suspense |
| Crear | `components/auth/ForgotPasswordForm.tsx` | Client component — formulario de email |
| Crear | `app/auth/reset-callback/page.tsx` | Client component — intercambia code PKCE, redirige |
| Crear | `app/auth/reset-password/page.tsx` | Page wrapper con Suspense |
| Crear | `components/auth/ResetPasswordForm.tsx` | Client component — formulario nueva contraseña |
| Crear | `app/actions/reset-password.actions.ts` | Server action para llamar updateUser() |

---

## Task 1: Extender el Port de Auth

**Archivo:** `application/ports/auth.repository.port.ts`

- [ ] **Paso 1: Agregar DTO y método al port**

Abrir `application/ports/auth.repository.port.ts` y agregar al final del archivo (antes del cierre) el nuevo DTO y el método en la interfaz:

```typescript
// Agregar junto a los otros DTOs existentes:
export interface ForgotPasswordDTO {
  email: string
}

export interface ForgotPasswordResult {
  error: string | null
}
```

Y en la interfaz `IAuthRepository`, agregar el método:

```typescript
requestPasswordReset(data: ForgotPasswordDTO): Promise<ForgotPasswordResult>
```

- [ ] **Paso 2: Verificar que TypeScript acepta el cambio**

```bash
npx tsc --noEmit 2>&1 | grep "auth.repository.port"
```

Resultado esperado: sin errores en ese archivo. Habrá un error en `supabase-auth.repository.ts` porque la clase todavía no implementa el nuevo método — eso es correcto, se resuelve en Task 2.

---

## Task 2: Implementar `requestPasswordReset` en el Repositorio

**Archivo:** `adapters/repositories/supabase-auth.repository.ts`

- [ ] **Paso 1: Agregar import del nuevo DTO**

Al inicio del archivo, en la línea de imports desde el port, agregar `ForgotPasswordDTO` y `ForgotPasswordResult`:

```typescript
import {
  IAuthRepository,
  RegisterDTO,
  LoginDTO,
  AuthResult,
  OAuthResult,
  ForgotPasswordDTO,      // agregar
  ForgotPasswordResult,   // agregar
} from '@/application/ports/auth.repository.port'
```

- [ ] **Paso 2: Implementar el método en la clase**

Dentro de la clase `SupabaseAuthRepository`, agregar el método después del último método existente:

```typescript
async requestPasswordReset(data: ForgotPasswordDTO): Promise<ForgotPasswordResult> {
  const { error } = await this.supabase.auth.resetPasswordForEmail(data.email, {
    redirectTo: data.redirectTo,
  })

  if (error) {
    return { error: error.message }
  }

  return { error: null }
}
```

Espera — el `redirectTo` no está en el DTO todavía. Actualizar el DTO en el port (Task 1) para incluirlo:

```typescript
export interface ForgotPasswordDTO {
  email: string
  redirectTo: string
}
```

- [ ] **Paso 3: Verificar compilación**

```bash
npx tsc --noEmit 2>&1 | grep -E "(supabase-auth|auth.repository.port)"
```

Resultado esperado: sin errores en esos archivos.

---

## Task 3: Use Case — `RequestPasswordResetUseCase`

**Archivo nuevo:** `application/use-cases/auth/request-password-reset.usecase.ts`

- [ ] **Paso 1: Crear el archivo**

```typescript
import {
  IAuthRepository,
  ForgotPasswordDTO,
  ForgotPasswordResult,
} from '@/application/ports/auth.repository.port'

export class RequestPasswordResetUseCase {
  constructor(private readonly authRepo: IAuthRepository) {}

  async execute(data: ForgotPasswordDTO): Promise<ForgotPasswordResult> {
    const email = data.email?.trim().toLowerCase()

    if (!email) {
      return { error: 'El correo electrónico es requerido.' }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return { error: 'Ingresa un correo electrónico válido.' }
    }

    return this.authRepo.requestPasswordReset({
      email,
      redirectTo: data.redirectTo,
    })
  }
}
```

- [ ] **Paso 2: Verificar compilación**

```bash
npx tsc --noEmit 2>&1 | grep "request-password-reset"
```

Resultado esperado: sin salida (sin errores).

---

## Task 4: Server Action — `forgotPasswordAction`

**Archivo nuevo:** `app/actions/forgot-password.actions.ts`

- [ ] **Paso 1: Crear el archivo**

```typescript
'use server'

import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { SupabaseAuthRepository } from '@/adapters/repositories/supabase-auth.repository'
import { RequestPasswordResetUseCase } from '@/application/use-cases/auth/request-password-reset.usecase'

interface ActionState {
  error?: string
  success?: boolean
}

export async function forgotPasswordAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const email = formData.get('email') as string

  const headersList = await headers()
  const origin = headersList.get('origin') || ''
  const redirectTo = `${origin}/auth/reset-callback`

  const supabase = await createClient()
  const authRepo = new SupabaseAuthRepository(supabase)
  const useCase = new RequestPasswordResetUseCase(authRepo)

  const result = await useCase.execute({ email, redirectTo })

  if (result.error) {
    return { error: result.error }
  }

  return { success: true }
}
```

- [ ] **Paso 2: Verificar compilación**

```bash
npx tsc --noEmit 2>&1 | grep "forgot-password"
```

Resultado esperado: sin errores.

---

## Task 5: Componente — `ForgotPasswordForm`

**Archivo nuevo:** `components/auth/ForgotPasswordForm.tsx`

- [ ] **Paso 1: Crear el formulario cliente**

```tsx
'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { forgotPasswordAction } from '@/app/actions/forgot-password.actions'

interface ActionState {
  error?: string
  success?: boolean
}

const initialState: ActionState = {}

export default function ForgotPasswordForm() {
  const [state, action, isPending] = useActionState(forgotPasswordAction, initialState)

  if (state.success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Revisa tu correo</h2>
        <p className="text-gray-500 text-sm mb-6">
          Si existe una cuenta con ese correo, recibirás un enlace para restablecer tu contraseña en los próximos minutos.
        </p>
        <Link
          href="/login"
          className="text-[#1B4F8C] text-sm font-medium hover:underline"
        >
          Volver al inicio de sesión
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1">¿Olvidaste tu contraseña?</h1>
      <p className="text-gray-500 text-sm mb-8">
        Ingresa tu correo y te enviaremos un enlace para restablecerla.
      </p>

      {state.error && (
        <div className="animate-slide-down mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
            Correo Electrónico
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
              </svg>
            </div>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="tu@ejemplo.com"
              required
              autoComplete="email"
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-gray-100 border border-transparent text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1B4F8C] focus:ring-2 focus:ring-[#1B4F8C]/20 transition-all duration-200"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 rounded-xl bg-[#1A3C6E] text-white font-semibold text-sm hover:bg-[#1B4F8C] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] shadow-md"
        >
          {isPending ? 'Enviando...' : 'Enviar enlace de recuperación'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-500">
        ¿Recordaste tu contraseña?{' '}
        <Link href="/login" className="text-[#1B4F8C] font-medium hover:underline">
          Iniciar sesión
        </Link>
      </p>
    </div>
  )
}
```

---

## Task 6: Page — `/forgot-password`

**Archivo nuevo:** `app/(auth)/forgot-password/page.tsx`

- [ ] **Paso 1: Crear la page**

```tsx
import { Suspense } from 'react'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center py-8">
        <div className="w-8 h-8 border-4 border-[#1B4F8C] border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ForgotPasswordForm />
    </Suspense>
  )
}
```

- [ ] **Paso 2: Verificar que la ruta existe y compila**

```bash
npx tsc --noEmit 2>&1 | grep "forgot-password"
```

Resultado esperado: sin errores.

- [ ] **Paso 3: Test manual — formulario visible**

Navegar a `http://localhost:3000/forgot-password` (con `npm run dev`). Verificar:
- Se muestra el formulario con campo de email
- El link "Iniciar sesión" navega a `/login`
- El link en login "¿Olvidaste tu contraseña?" ya apunta a `/forgot-password` (ya existe en el código)

- [ ] **Paso 4: Commit parcial**

```bash
git add \
  application/ports/auth.repository.port.ts \
  adapters/repositories/supabase-auth.repository.ts \
  application/use-cases/auth/request-password-reset.usecase.ts \
  app/actions/forgot-password.actions.ts \
  components/auth/ForgotPasswordForm.tsx \
  "app/(auth)/forgot-password/page.tsx"
git commit -m "feat: add forgot password form and request-reset use case"
```

---

## Task 7: Callback — `/auth/reset-callback`

Este es el destino del enlace que Supabase envía por email. Recibe el `code` PKCE en la query string, lo intercambia por una sesión, y redirige al formulario de nueva contraseña.

**Archivo nuevo:** `app/auth/reset-callback/page.tsx`

- [ ] **Paso 1: Crear el componente**

```tsx
'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Suspense } from 'react'

function ResetCallbackInner() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    const error = searchParams.get('error')
    const errorDescription = searchParams.get('error_description')

    if (error) {
      router.replace(
        `/forgot-password?error=${encodeURIComponent(errorDescription || error)}`
      )
      return
    }

    if (!code) {
      router.replace('/forgot-password')
      return
    }

    const supabase = createClient()
    supabase.auth.exchangeCodeForSession(code).then(({ error: exchangeError }) => {
      if (exchangeError) {
        router.replace(
          `/forgot-password?error=${encodeURIComponent(exchangeError.message)}`
        )
      } else {
        router.replace('/auth/reset-password')
      }
    })
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#1B4F8C] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500 text-sm">Verificando enlace...</p>
      </div>
    </div>
  )
}

export default function ResetCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8]">
        <div className="w-10 h-10 border-4 border-[#1B4F8C] border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    }>
      <ResetCallbackInner />
    </Suspense>
  )
}
```

> **Nota:** `useSearchParams()` requiere Suspense boundary — por eso se separa en `ResetCallbackInner`. Este es el mismo patrón que usa `invite-callback/page.tsx`.

- [ ] **Paso 2: Verificar compilación**

```bash
npx tsc --noEmit 2>&1 | grep "reset-callback"
```

Resultado esperado: sin errores.

---

## Task 8: Server Action — `resetPasswordAction`

Sigue el patrón de `app/actions/set-password.actions.ts` — llama directamente a Supabase sin repositorio, ya que opera sobre la sesión activa del usuario.

**Archivo nuevo:** `app/actions/reset-password.actions.ts`

- [ ] **Paso 1: Crear el archivo**

```typescript
'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { prisma } from '@/lib/prisma'

interface ActionState {
  error?: string
  success?: boolean
}

export async function resetPasswordAction(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || password.length < 8) {
    return { error: 'La contraseña debe tener al menos 8 caracteres.' }
  }

  if (!/\d/.test(password)) {
    return { error: 'La contraseña debe contener al menos un número.' }
  }

  if (password !== confirmPassword) {
    return { error: 'Las contraseñas no coinciden.' }
  }

  const supabase = await createClient()

  const { error } = await supabase.auth.updateUser({ password })

  if (error) {
    return { error: 'No se pudo actualizar la contraseña. El enlace puede haber expirado.' }
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { role: true },
  })

  if (dbUser?.role === 'admin') redirect('/admin')
  if (dbUser?.role === 'docente') redirect('/teacher-dashboard')
  redirect('/dashboard')
}
```

- [ ] **Paso 2: Verificar compilación**

```bash
npx tsc --noEmit 2>&1 | grep "reset-password"
```

Resultado esperado: sin errores.

---

## Task 9: Componente — `ResetPasswordForm`

**Archivo nuevo:** `components/auth/ResetPasswordForm.tsx`

- [ ] **Paso 1: Crear el formulario**

```tsx
'use client'

import { useActionState, useState } from 'react'
import { resetPasswordAction } from '@/app/actions/reset-password.actions'

interface ActionState {
  error?: string
  success?: boolean
}

const initialState: ActionState = {}

export default function ResetPasswordForm() {
  const [state, action, isPending] = useActionState(resetPasswordAction, initialState)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <div>
      <h1 className="text-3xl font-extrabold text-gray-900 mb-1">Nueva contraseña</h1>
      <p className="text-gray-500 text-sm mb-8">
        Elige una contraseña segura de al menos 8 caracteres con un número.
      </p>

      {state.error && (
        <div className="animate-slide-down mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {state.error}
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
            Nueva contraseña
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Tu nueva contraseña"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-100 border border-transparent text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1B4F8C] focus:ring-2 focus:ring-[#1B4F8C]/20 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showPassword ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
            Confirmar contraseña
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
              </svg>
            </div>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirm ? 'text' : 'password'}
              placeholder="Repite tu contraseña"
              required
              minLength={8}
              autoComplete="new-password"
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-gray-100 border border-transparent text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:border-[#1B4F8C] focus:ring-2 focus:ring-[#1B4F8C]/20 transition-all duration-200"
            />
            <button
              type="button"
              onClick={() => setShowConfirm(v => !v)}
              className="absolute inset-y-0 right-3 flex items-center text-gray-400 hover:text-gray-600"
              tabIndex={-1}
            >
              {showConfirm ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                </svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3.5 rounded-xl bg-[#1A3C6E] text-white font-semibold text-sm hover:bg-[#1B4F8C] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] shadow-md"
        >
          {isPending ? 'Guardando...' : 'Guardar nueva contraseña'}
        </button>
      </form>
    </div>
  )
}
```

---

## Task 10: Page — `/auth/reset-password`

**Archivo nuevo:** `app/auth/reset-password/page.tsx`

Esta page vive fuera del grupo `(auth)` porque el layout de `(auth)` redirige a usuarios autenticados — y en este punto el usuario YA está autenticado (la sesión fue establecida en el callback). Esto es idéntico al comportamiento de `app/auth/set-password/page.tsx`.

- [ ] **Paso 1: Crear la page**

```tsx
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import ResetPasswordForm from '@/components/auth/ResetPasswordForm'

export default async function ResetPasswordPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/forgot-password?error=' + encodeURIComponent('El enlace expiró. Solicita uno nuevo.'))
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F0F4F8] px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        <Suspense fallback={
          <div className="flex justify-center py-8">
            <div className="w-8 h-8 border-4 border-[#1B4F8C] border-t-transparent rounded-full animate-spin" />
          </div>
        }>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
```

- [ ] **Paso 2: Verificar compilación final completa**

```bash
npx tsc --noEmit 2>&1 | grep -E "(forgot|reset|callback)" | grep -v ".next"
```

Resultado esperado: sin errores en los nuevos archivos.

- [ ] **Paso 3: Commit final**

```bash
git add \
  app/auth/reset-callback/page.tsx \
  app/auth/reset-password/page.tsx \
  app/actions/reset-password.actions.ts \
  components/auth/ResetPasswordForm.tsx
git commit -m "feat: add reset-callback, reset-password form and resetPasswordAction"
```

---

## Verificación end-to-end

1. `npm run dev`
2. Ir a `http://localhost:3000/login` → click "¿Olvidaste tu contraseña?"
3. Ingresar email de una cuenta existente → click "Enviar enlace" → ver mensaje de éxito
4. Revisar el correo (puede tardar 1-2 min, revisar spam)
5. Hacer click en el link del correo → debe navegar a `/auth/reset-callback` → spinner → redirige a `/auth/reset-password`
6. Ingresar nueva contraseña → confirmación → redirige al dashboard del rol correspondiente
7. Intentar login con la nueva contraseña → debe funcionar

**Casos de error a verificar:**
- Email con formato inválido → error visible en el formulario
- Contraseña < 8 caracteres → error en formulario de reset
- Contraseñas que no coinciden → error
- Acceder a `/auth/reset-password` sin sesión activa → redirige a `/forgot-password?error=...`
- Link de correo expirado (Supabase expira tokens en 1 hora por defecto) → la page `/auth/reset-callback` muestra error y redirige a `/forgot-password`

---

## Notas importantes

- **Supabase Dashboard:** Agregar `http://localhost:3000/auth/reset-callback` (dev) y la URL de producción a los Redirect URLs permitidos antes de probar.
- **Email en desarrollo:** Supabase envía emails reales en producción. En desarrollo local con Supabase local (supabase start), los emails aparecen en Inbucket (`http://localhost:54324`).
- **Token expiry:** Por defecto Supabase expira los tokens de recovery en 1 hora (configurable en Dashboard → Auth → Email Templates).
- **Seguridad:** El success message del formulario de `forgot-password` no revela si el email existe o no ("Si existe una cuenta...") — esto es intencional para prevenir enumeración de usuarios.
