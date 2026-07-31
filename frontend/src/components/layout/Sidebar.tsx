import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  CheckSquare,
  Users,
  UsersRound,
  Bell,
  MessageSquare,
  User,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { authStorage } from '@/lib/authStorage'
import { notificationsApi } from '@/features/notifications/api/notificationsApi'

type Item = {
  to: string
  label: string
  Icon: typeof CheckSquare
  adminOnly?: boolean
}

const items: Item[] = [
  { to: '/tasks', label: 'Tasks', Icon: CheckSquare },
  { to: '/teams', label: 'Teams', Icon: UsersRound },
  { to: '/chats', label: 'Chats', Icon: MessageSquare },
  { to: '/notifications', label: 'Notifications', Icon: Bell },
  { to: '/users', label: 'Users', Icon: Users, adminOnly: true },
  { to: '/profile', label: 'Profile', Icon: User },
]

export function Sidebar() {
  const role = authStorage.getRole()

  const { data } = useQuery({
    queryKey: ['notifications', 'unread-badge'],
    queryFn: () => notificationsApi.list({ unread: true, limit: 1 }),
    refetchOnWindowFocus: true,
  })
  const unread = data?.unreadCount ?? 0

  return (
    <aside className="hidden h-full w-60 shrink-0 border-r border-slate-200 bg-white p-4 md:block">
      <div className="mb-6 px-2">
        <p className="text-lg font-bold text-slate-900">TaskMgr</p>
        <p className="text-xs text-slate-500">Task Management System</p>
      </div>
      <nav className="flex flex-col gap-1">
        {items
          .filter((item) => !item.adminOnly || role === 'admin')
          .map(({ to, label, Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100',
                )
              }
            >
              <Icon size={16} />
              <span className="flex-1">{label}</span>
              {to === '/notifications' && unread > 0 ? (
                <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                  {unread}
                </span>
              ) : null}
            </NavLink>
          ))}
      </nav>
    </aside>
  )
}
