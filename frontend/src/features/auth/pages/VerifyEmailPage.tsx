import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { extractApiError } from '@/lib/apiClient'
import { authApi } from '../api/authApi'

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
    try {
      const res = await authApi.resendOtp(email, 'VERIFY_EMAIL')
      setInfo(
        (res as { devOtp?: string }).devOtp
          ? `Dev mode: your new code is ${(res as { devOtp?: string }).devOtp}`
          : 'A new code was sent.',
      )
    } catch (err) {
      setError(extractApiError(err, 'Could not resend code'))
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 p-4">
      <form
        onSubmit={onVerify}
        className="w-full max-w-sm space-y-4 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
        <div>
          <h1 className="text-xl font-semibold text-slate-900">Verify email</h1>
          <p className="text-sm text-slate-500">
            Enter the 6-digit code we sent you.
          </p>
        </div>

        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Input
          label="Verification code"
          inputMode="numeric"
          maxLength={6}
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        {info ? <p className="text-sm text-emerald-600">{info}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" className="w-full" loading={submitting}>
          Verify
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={onResend}
            className="text-slate-600 underline"
          >
            Resend code
          </button>
          <Link to="/login" className="font-medium text-slate-900 underline">
            Back to sign in
          </Link>
        </div>
      </form>
    </div>
  )
}
