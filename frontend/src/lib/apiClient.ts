import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { authStorage, handleSessionExpired } from './authStorage'

/**
 * Base URL strategy:
 *  - In dev, `vite.config.ts` proxies `/api/*` → `http://localhost:3000/*`.
 *  - In prod, set `VITE_API_URL` (e.g. `https://api.example.com`) in `.env`.
 */
const baseURL = import.meta.env.VITE_API_URL ?? '/api'

export const apiClient = axios.create({
  baseURL,
  timeout: 15000,
})

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStorage.getAccessToken()
  const role = authStorage.getRole()
  if (token && role) {
    // Backend expects `Authorization: bearer <token>` for `user`
    // and `Authorization: admin <token>` for `admin`.
    const prefix = role === 'admin' ? 'admin' : 'bearer'
    config.headers.set('Authorization', `${prefix} ${token}`)
  }
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const status = error.response?.status
    if (status === 401 || status === 403) {
      handleSessionExpired()
    }
    return Promise.reject(error)
  },
)

/** Pull the user-facing message out of a backend error response. */
export function extractApiError(err: unknown, fallback = 'Unexpected error'): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as
      | { message?: string; errors?: Array<{ field: string; message: string }> }
      | undefined
    if (data?.errors?.length) {
      return data.errors.map((e) => `${e.field}: ${e.message}`).join(' • ')
    }
    if (data?.message) return data.message
    if (err.message) return err.message
  }
  if (err instanceof Error) return err.message
  return fallback
}
