import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowLeft, KeyRound, Lock, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { OtpInput } from '@/components/ui/OtpInput'
import { ErrorState } from '@/components/ui/EmptyState'
import { extractApiError } from '@/lib/apiClient'
import { authApi } from '../api/authApi'
import { AuthLayout } from '../components/AuthLayout'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const location = useLocation() as { state?: { devOtp?: string } }

  const [email, setEmail] = useState(params.get('email') ?? '')
  const [otp, setOtp] = useState(location.state?.devOtp ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const mismatch = !!confirmPassword && newPassword !== confirmPassword

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (mismatch) return
    setError(null)
    setSubmitting(true)
    try {
      await authApi.resetPassword({ email, otp, newPassword, confirmPassword })
      navigate('/login', { replace: true })
    } catch (err) {
      setError(extractApiError(err, 'Reset failed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout
      title="Choose a new password"
      subtitle="Enter the code we emailed you, then set a new password."
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
      <form onSubmit={onSubmit} className="space-y-5">
        {location.state?.devOtp ? (
          <p className="flex items-start gap-2 rounded-xl border border-success/25 bg-success-soft px-3.5 py-2.5 text-sm text-success-soft-fg">
            <MailCheck size={16} className="mt-px shrink-0" />
            Dev mode: your code is {location.state.devOtp}
          </p>
        ) : null}

        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <OtpInput
          value={otp}
          onChange={setOtp}
          label="Reset code"
          autoFocus={!!email}
        />

        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          icon={<Lock size={16} />}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          hint="At least 8 characters with upper, lower, a digit and a symbol."
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          placeholder="••••••••"
          icon={<Lock size={16} />}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={mismatch ? 'Passwords do not match' : undefined}
          required
        />

        {error ? <ErrorState message={error} /> : null}

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={otp.length < 6 || !newPassword || mismatch}
        >
          {!submitting ? <KeyRound size={16} /> : null}
          Reset password
        </Button>
      </form>
    </AuthLayout>
  )
}
