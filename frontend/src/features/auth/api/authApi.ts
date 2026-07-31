import { apiClient } from '@/lib/apiClient'
import type {
  ForgetPasswordResponse,
  LoginPayload,
  LoginResponse,
  ResetPasswordPayload,
  SignupPayload,
  SignupResponse,
  VerifyEmailPayload,
} from '../types'

export const authApi = {
  signup(payload: SignupPayload) {
    return apiClient
      .post<SignupResponse>('/users/auth/signup', payload)
      .then((r) => r.data)
  },
  login(payload: LoginPayload) {
    return apiClient
      .post<LoginResponse>('/users/auth/login', payload)
      .then((r) => r.data)
  },
  verifyEmail(payload: VerifyEmailPayload) {
    return apiClient
      .post('/users/auth/verify-email', payload)
      .then((r) => r.data)
  },
  forgetPassword(email: string) {
    return apiClient
      .post<ForgetPasswordResponse>('/users/auth/forget-password', { email })
      .then((r) => r.data)
  },
  resetPassword(payload: ResetPasswordPayload) {
    return apiClient
      .post('/users/auth/reset-password', payload)
      .then((r) => r.data)
  },
  resendOtp(email: string, purpose: 'VERIFY_EMAIL' | 'RESET_PASSWORD') {
    return apiClient
      .post('/users/auth/resend-otp', { email, purpose })
      .then((r) => r.data)
  },
  logout() {
    return apiClient.post('/users/auth/logout').then((r) => r.data)
  },
}
