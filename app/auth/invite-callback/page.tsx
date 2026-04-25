'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function InviteCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()

    async function handleCallback() {
      // Flujo implicit (hash): Supabase redirige con #access_token=...&refresh_token=...
      const hash = window.location.hash.slice(1)
      if (hash) {
        const params = new URLSearchParams(hash)
        const access_token = params.get('access_token')
        const refresh_token = params.get('refresh_token')

        if (access_token && refresh_token) {
          const { error } = await supabase.auth.setSession({ access_token, refresh_token })
          if (error) router.replace('/login?error=El+enlace+es+inválido+o+ya+expiró')
          else router.replace('/auth/set-password')
          return
        }
      }

      // Flujo PKCE (query): Supabase redirige con ?code=...
      const code = new URLSearchParams(window.location.search).get('code')
      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code)
        if (error) router.replace('/login?error=El+enlace+es+inválido+o+ya+expiró')
        else router.replace('/auth/set-password')
        return
      }

      router.replace('/login?error=El+enlace+es+inválido+o+ya+expiró')
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#00B5B5] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Procesando invitación...</p>
      </div>
    </div>
  )
}
