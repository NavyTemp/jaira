import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Mail, Send } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { ErrorState } from '@/components/ui/EmptyState'
import { extractApiError } from '@/lib/apiClient'
import { authApi } from '../api/authApi'
import { AuthLayout } from '../components/AuthLayout'

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await authApi.forgetPassword(email)
      navigate(`/reset-password?email=${encodeURIComponent(email)}`, {
        state: { devOtp: res.devOtp },
      })
    } catch (err) {
      setError(extractApiError(err, 'Request failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="Enter the email on your account and we'll send you a reset code."
      footer={
        <p className="text-center text-sm text-muted">
          <Link
            to="/login"
            className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline"
          >
            <ArrowLeft size={14} />
            Back to sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@company.com"
          icon={<Mail size={16} />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoFocus
        />

        {error ? <ErrorState message={error} /> : null}

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={!email.trim()}
        >
          {!submitting ? <Send size={16} /> : null}
          Send reset code
        </Button>
      </form>
    </AuthLayout>
  )
}
