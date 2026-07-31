import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Lock, Mail, Phone, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { ErrorState } from '@/components/ui/EmptyState'
import { extractApiError } from '@/lib/apiClient'
import { authApi } from '../api/authApi'
import { signupSchema } from '../schemas'
import type { SignupValues } from '../schemas'
import { AuthLayout } from '../components/AuthLayout'

export function SignupPage() {
  const navigate = useNavigate()
  const [serverError, setServerError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SignupValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: { gender: 'male' },
  })

  const onSubmit = async (values: SignupValues) => {
    setServerError(null)
    setSubmitting(true)
    try {
      const res = await authApi.signup(values)
      navigate(`/verify-email?email=${encodeURIComponent(values.email)}`, {
        state: { devOtp: res.devOtp },
        replace: true,
      })
    } catch (err) {
      setServerError(extractApiError(err, 'Signup failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up your workspace in under a minute."
      footer={
        <p className="text-center text-sm text-muted">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Full name"
          placeholder="Jane Cooper"
          icon={<User size={16} />}
          autoComplete="name"
          {...register('name')}
          error={errors.name?.message}
        />
        <Input
          label="Email"
          type="email"
          placeholder="you@company.com"
          icon={<Mail size={16} />}
          autoComplete="email"
          {...register('email')}
          error={errors.email?.message}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Phone"
            placeholder="010xxxxxxxx"
            icon={<Phone size={16} />}
            autoComplete="tel"
            {...register('phone')}
            error={errors.phone?.message}
          />
          <Input
            label="Age"
            type="number"
            placeholder="24"
            {...register('age', { valueAsNumber: true })}
            error={errors.age?.message}
          />
        </div>

        <Select
          label="Gender"
          {...register('gender')}
          error={errors.gender?.message}
        >
          <option value="male">Male</option>
          <option value="female">Female</option>
        </Select>

        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          icon={<Lock size={16} />}
          autoComplete="new-password"
          {...register('password')}
          error={errors.password?.message}
          hint="At least 8 characters with upper, lower, a digit and a symbol."
        />
        <Input
          label="Confirm password"
          type="password"
          placeholder="••••••••"
          icon={<Lock size={16} />}
          autoComplete="new-password"
          {...register('confirmpassword')}
          error={errors.confirmpassword?.message}
        />

        {serverError ? <ErrorState message={serverError} /> : null}

        <Button type="submit" size="lg" fullWidth loading={submitting}>
          Create account
          {!submitting ? <ArrowRight size={17} /> : null}
        </Button>
      </form>
    </AuthLayout>
  )
}
