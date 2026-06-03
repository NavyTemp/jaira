import { apiClient } from '@/lib/apiClient'
import type { LoginPayload, LoginResponse, SignupPayload } from '../types'

export const authApi = {
  signup(payload: SignupPayload) {
    return apiClient.post('/users/signup', payload).then((r) => r.data)
  },
  login(payload: LoginPayload) {
    return apiClient
      .post<LoginResponse>('/users/login', payload)
      .then((r) => r.data)
  },
  refresh() {
    return apiClient.post('/users/refreshToken').then((r) => r.data)
  },
}
