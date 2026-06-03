import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { authStorage } from '@/lib/authStorage'

export function Header() {
  const navigate = useNavigate()
  const user = authStorage.getUser()

  const onLogout = () => {
    authStorage.clear()
    navigate('/login', { replace: true })
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
      <div className="text-sm text-slate-600">
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
