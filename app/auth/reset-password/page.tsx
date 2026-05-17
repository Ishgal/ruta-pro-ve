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
