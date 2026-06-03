import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { authStorage } from '@/lib/authStorage'

type Props = {
  children: ReactNode
  /** Restrict access to one or more roles (defaults to any authenticated user). */
  roles?: Array<'user' | 'admin'>
}

export function ProtectedRoute({ children, roles }: Props) {
  const location = useLocation()
  const token = authStorage.getAccessToken()
  const role = authStorage.getRole()

  if (!token || !role) {
    const next = encodeURIComponent(location.pathname + location.search)
    return <Navigate to={`/login?next=${next}`} replace />
  }
  if (roles && !roles.includes(role)) {
    return <Navigate to="/tasks" replace />
  }
  return <>{children}</>
}
