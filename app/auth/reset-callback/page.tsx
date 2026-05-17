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
