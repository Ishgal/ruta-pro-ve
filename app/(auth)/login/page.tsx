import AuthSplitLayout from '@/components/auth/AuthSplitLayout'
import LoginForm from '@/components/auth/LoginForm'

export const metadata = {
  title: 'Iniciar Sesión | Ruta Pro-VE',
}

interface LoginPageProps {
  searchParams: Promise<{ error?: string }>
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { error } = await searchParams

  return (
    <AuthSplitLayout mode="login">
      <LoginForm errorParam={error} />
    </AuthSplitLayout>
  )
}
