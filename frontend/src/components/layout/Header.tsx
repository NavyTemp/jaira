import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { authStorage } from '@/lib/authStorage'
import { authApi } from '@/features/auth/api/authApi'
import { useSocket } from '@/lib/SocketContext'

export function Header() {
  const navigate = useNavigate()
  const user = authStorage.getUser()
  const { connected } = useSocket()

  const onLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      /* best-effort: revoke server-side token */
    }
    authStorage.clear()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="flex items-center gap-3 text-sm text-slate-600">
        <span
          className={
            'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium ' +
            (connected
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-slate-100 text-slate-500')
          }
          title={connected ? 'Realtime connected' : 'Realtime offline'}
        >
          <span
            className={
              'h-2 w-2 rounded-full ' +
              (connected ? 'bg-emerald-500' : 'bg-slate-400')
            }
          />
          {connected ? 'Live' : 'Offline'}
        </span>
        {user ? (
          <span>
            Signed in as{' '}
            <span className="font-medium text-slate-900">{user.name}</span>{' '}
            <span className="text-slate-400">({user.role})</span>
          </span>
        ) : (
          <span>Not signed in</span>
        )}
      </div>
      <Button variant="ghost" size="sm" onClick={onLogout}>
        <LogOut size={14} />
        Logout
      </Button>
    </header>
  )
}
