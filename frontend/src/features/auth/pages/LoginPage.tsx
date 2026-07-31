import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Lock, Mail } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ErrorState } from '@/components/ui/EmptyState'
import { authStorage } from '@/lib/authStorage'
import { extractApiError } from '@/lib/apiClient'
import { authApi } from '../api/authApi'
import { loginSchema } from '../schemas'
import type { LoginValues } from '../schemas'
import { AuthLayout } from '../components/AuthLayout'

export function LoginPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const next = params.get('next') ?? '/dashboard'

  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    getValues,
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
      authStorage.setSession({
        accessToken: res.access_token,
        refreshToken: res.refresh_token,
        user: {
          _id: res.user._id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
        },
      })
      navigate(next, { replace: true })
    } catch (err) {
      const message = extractApiError(err, 'Login failed')
      // Unverified accounts should go verify first.
      if (message.toLowerCase().includes('verify')) {
        navigate(`/verify-email?email=${encodeURIComponent(getValues('email'))}`)
        return
      }
      setServerError(message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to pick up where you left off."
      footer={
        <p className="text-center text-sm text-muted">
          Don't have an account?{' '}
          <Link
            to="/signup"
            className="font-semibold text-brand hover:underline"
          >
            Create one for free
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          icon={<Mail size={16} />}
          {...register('email')}
          error={errors.email?.message}
        />
        <Input
          label="Password"
          type="password"
          autoComplete="current-password"
          placeholder="••••••••"
          icon={<Lock size={16} />}
          {...register('password')}
          error={errors.password?.message}
        />

        <div className="flex justify-end">
          <Link
            to="/forgot-password"
            className="text-sm font-medium text-brand hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        {serverError ? <ErrorState message={serverError} /> : null}

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Sign in
          {!submitting ? <ArrowRight size={17} /> : null}
        </Button>
      </form>
    </AuthLayout>
  )
}
