import { Navigate, useNavigate } from 'react-router-dom'
import { errorMessage } from '@/lib/api'
import { LoginForm, type LoginValues } from './login-form'
import { useLogin, useMe } from './use-auth'

export function LoginPage() {
  const navigate = useNavigate()
  const me = useMe()
  const login = useLogin()

  if (me.data) return <Navigate to="/" replace />

  const onLogin = (values: LoginValues) => {
    login.mutate(values, { onSuccess: () => navigate('/', { replace: true }) })
  }

  return (
    <div className="flex min-h-svh w-full items-center justify-center p-6 md:p-10">
      <div className="w-full max-w-sm">
        <LoginForm
          onLogin={onLogin}
          pending={login.isPending}
          error={login.isError ? errorMessage(login.error) : null}
        />
      </div>
    </div>
  )
}
