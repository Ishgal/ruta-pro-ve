import { Suspense } from 'react'
import AuthSplitLayout from '@/components/auth/AuthSplitLayout'
import ForgotPasswordForm from '@/components/auth/ForgotPasswordForm'

export const metadata = {
  title: 'Recuperar Contraseña | Ruta Pro-VE',
}

export default function ForgotPasswordPage() {
  return (
    <AuthSplitLayout mode="forgot-password">
      <Suspense fallback={
        <div className="flex justify-center py-8">
          <div className="w-8 h-8 border-4 border-[#1B4F8C] border-t-transparent rounded-full animate-spin" />
        </div>
      }>
        <ForgotPasswordForm />
      </Suspense>
    </AuthSplitLayout>
  )
}
