const ACCESS_KEY = 'tms_access_token'
const REFRESH_KEY = 'tms_refresh_token'
const USER_KEY = 'tms_user'
const ROLE_KEY = 'tms_user_role'

export type StoredUser = {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
}

export const authStorage = {
  getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY)
  },
  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY)
  },
  getRole(): 'user' | 'admin' | null {
    const r = localStorage.getItem(ROLE_KEY)
    return r === 'admin' || r === 'user' ? r : null
  },
  getUser(): StoredUser | null {
    const raw = localStorage.getItem(USER_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as StoredUser
    } catch {
      return null
    }
  },
  setSession(args: {
    accessToken: string
    refreshToken: string
    user: StoredUser
  }): void {
    localStorage.setItem(ACCESS_KEY, args.accessToken)
    localStorage.setItem(REFRESH_KEY, args.refreshToken)
    localStorage.setItem(USER_KEY, JSON.stringify(args.user))
    localStorage.setItem(ROLE_KEY, args.user.role)
  },
  clear(): void {
    localStorage.removeItem(ACCESS_KEY)
    localStorage.removeItem(REFRESH_KEY)
    localStorage.removeItem(USER_KEY)
    localStorage.removeItem(ROLE_KEY)
  },
}

/**
 * Centralised "your session is over" handler.
 * Called from the axios 401 interceptor.
 */
export function handleSessionExpired(): void {
  authStorage.clear()
  const next = encodeURIComponent(
    window.location.pathname + window.location.search,
  )
  if (!window.location.pathname.startsWith('/login')) {
    window.location.replace(`/login?next=${next}`)
  }
}
