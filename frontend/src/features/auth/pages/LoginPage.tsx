import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { authStorage } from '@/lib/authStorage'
import { extractApiError } from '@/lib/apiClient'
import { authApi } from '../api/authApi'
import { loginSchema } from '../schemas'
import type { LoginValues } from '../schemas'

export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') ?? '/tasks'

  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  const onSubmit = async (values: LoginValues) => {
    setServerError(null)
    setSubmitting(true)
    try {
      const res = await authApi.login(values)
      // The backend does not return the user object on login (yet),
      // so we store the minimum we know and let /users routes refine it later.
      authStorage.setSession({
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        user: {
          _id: '',
          name: values.email.split('@')[0] ?? 'user',
          email: values.email,
          role: 'user',
        },
      })
      navigate(next, { replace: true })
    } catch (err) {
      setServerError(extractApiError(err, 'Login failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Sign in</h1>
          <p className="text-sm text-slate-500">Task Management System</p>
        </div>

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          {...register('password')}
          error={errors.password?.message}
        />

        {serverError ? (
          <p className="text-sm text-red-600">{serverError}</p>
        ) : null}

        <Button type="submit" className="w-full" loading={submitting}>
          Sign in
        </Button>

        <p className="text-center text-sm text-slate-600">
          No account?{' '}
          <Link to="/signup" className="font-medium text-slate-900 underline">
            Create one
          </Link>
        </p>
      </form>
    </div>
  )
}
