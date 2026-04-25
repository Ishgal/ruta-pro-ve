import AuthSplitLayout from '@/components/auth/AuthSplitLayout'
import RegisterForm from '@/components/auth/RegisterForm'

export const metadata = {
  title: 'Crear Cuenta | Ruta Pro-VE',
}

export default function RegisterPage() {
  return (
    <AuthSplitLayout mode="register">
      <RegisterForm />
    </AuthSplitLayout>
  )
}
