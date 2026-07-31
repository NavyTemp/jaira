import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, MailCheck } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { OtpInput } from '@/components/ui/OtpInput'
import { ErrorState } from '@/components/ui/EmptyState'
import { extractApiError } from '@/lib/apiClient'
import { authApi } from '../api/authApi'
import { AuthLayout } from '../components/AuthLayout'

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const location = useLocation() as { state?: { devOtp?: string } }

  const [email, setEmail] = useState(params.get('email') ?? '')
  const [otp, setOtp] = useState(location.state?.devOtp ?? '')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(
    location.state?.devOtp
      ? `Dev mode: your code is ${location.state.devOtp}`
      : null,
  )
  const [submitting, setSubmitting] = useState(false)
  const [resending, setResending] = useState(false)

  const onVerify = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await authApi.verifyEmail({ email, otp })
      navigate('/login', { replace: true })
    } catch (err) {
      setError(extractApiError(err, 'Verification failed'))
    } finally {
      setSubmitting(false)
    }
  }

  const onResend = async () => {
    setError(null)
    setInfo(null)
    setResending(true)
    try {
      const res = await authApi.resendOtp(email, 'VERIFY_EMAIL')
      const devOtp = (res as { devOtp?: string }).devOtp
      setInfo(
        devOtp ? `Dev mode: your new code is ${devOtp}` : 'A new code was sent.',
      )
    } catch (err) {
      setError(extractApiError(err, 'Could not resend code'))
    } finally {
      setResending(false)
    }
  }

  return (
    <AuthLayout
      title="Verify your email"
      subtitle={
        email
          ? `We sent a 6-digit code to ${email}. Enter it below to activate your account.`
          : 'Enter your email and the 6-digit code we sent you.'
      }
      footer={
        <p className="text-center text-sm text-muted">
          Wrong account?{' '}
          <Link to="/login" className="font-semibold text-brand hover:underline">
            Back to sign in
          </Link>
        </p>
      }
    >
      <form onSubmit={onVerify} className="space-y-5">
        <Input
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <OtpInput value={otp} onChange={setOtp} autoFocus={!!email} />

        {info ? (
          <p className="flex items-start gap-2 rounded-xl border border-success/25 bg-success-soft px-3.5 py-2.5 text-sm text-success-soft-fg">
            <MailCheck size={16} className="mt-px shrink-0" />
            {info}
          </p>
        ) : null}
        {error ? <ErrorState message={error} /> : null}

        <Button
          type="submit"
          size="lg"
          fullWidth
          loading={submitting}
          disabled={otp.length < 6 || !email}
        >
          Verify email
          {!submitting ? <ArrowRight size={17} /> : null}
        </Button>

        <p className="text-center text-sm text-muted">
          Didn't get it?{' '}
          <button
            type="button"
            onClick={onResend}
            disabled={resending || !email}
            className="font-semibold text-brand hover:underline disabled:opacity-50"
          >
            {resending ? 'Sending…' : 'Resend code'}
          </button>
        </p>
      </form>
    </AuthLayout>
  )
}
