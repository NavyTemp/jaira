import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Bell,
  CheckSquare,
  LayoutDashboard,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  Users,
  UsersRound,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/cn'
import { authStorage } from '@/lib/authStorage'
import { notificationsApi } from '@/features/notifications/api/notificationsApi'
import { Button } from '@/components/ui/Button'

type Item = {
  to: string
  label: string
  Icon: LucideIcon
  adminOnly?: boolean
  badge?: 'notifications'
}

const items: Item[] = [
  { to: '/dashboard', label: 'Dashboard', Icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', Icon: CheckSquare },
  { to: '/teams', label: 'Teams', Icon: UsersRound },
  { to: '/chats', label: 'Chats', Icon: MessageSquare },
  {
    to: '/notifications',
    label: 'Notifications',
    Icon: Bell,
    badge: 'notifications',
  },
  { to: '/users', label: 'Users', Icon: Users, adminOnly: true },
  { to: '/profile', label: 'Profile', Icon: User },
]

function Logo({ collapsed }: { collapsed: boolean }) {
  return (
    <div className={cn('flex items-center gap-2.5', collapsed && 'justify-center')}>
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white shadow-sm">
        T
      </span>
      {!collapsed ? (
        <div className="min-w-0">
          <p className="truncate text-sm font-bold tracking-tight text-fg">
            TaskFlow
          </p>
          <p className="truncate text-[11px] text-subtle">Team workspace</p>
        </div>
      ) : null}
    </div>
  )
}

function NavItems({
  collapsed,
  unread,
  onNavigate,
}: {
  collapsed: boolean
  unread: number
  onNavigate?: () => void
}) {
  const role = authStorage.getRole()

  return (
    <nav className="flex flex-col gap-1">
      {items
        .filter((item) => !item.adminOnly || role === 'admin')
        .map(({ to, label, Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              cn(
                'group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                collapsed && 'justify-center px-0',
                isActive
                  ? 'bg-brand-soft text-brand-soft-fg'
                  : 'text-muted hover:bg-surface-3 hover:text-fg',
              )
            }
          >
            {({ isActive }) => (
              <>
                {isActive ? (
                  <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-brand" />
                ) : null}
                <Icon size={18} className="shrink-0" />
                {!collapsed ? <span className="flex-1">{label}</span> : null}
                {badge === 'notifications' && unread > 0 ? (
                  <span
                    className={cn(
                      'grid min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white',
                      collapsed &&
                        'absolute right-1.5 top-1.5 h-2 w-2 min-w-0 px-0 text-transparent',
                    )}
                  >
                    {unread > 99 ? '99+' : unread}
                  </span>
                ) : null}
              </>
            )}
          </NavLink>
        ))}
    </nav>
  )
}

export function Sidebar({
  collapsed,
  onToggleCollapsed,
  mobileOpen,
  onCloseMobile,
}: {
  collapsed: boolean
  onToggleCollapsed: () => void
  mobileOpen: boolean
  onCloseMobile: () => void
}) {
  const { data } = useQuery({
    queryKey: ['notifications', 'unread-badge'],
    queryFn: () => notificationsApi.list({ unread: true, limit: 1 }),
    refetchOnWindowFocus: true,
  })
  const unread = data?.unreadCount ?? 0

  return (
    <>
      {/* ── Desktop rail ── */}
      <aside
        className={cn(
          'hidden h-full shrink-0 flex-col border-r border-border bg-surface transition-[width] duration-200 md:flex',
          collapsed ? 'w-[4.5rem]' : 'w-64',
        )}
      >
        <div
          className={cn(
            'flex h-16 items-center border-b border-border px-4',
            collapsed ? 'justify-center' : 'justify-between',
          )}
        >
          <Logo collapsed={collapsed} />
        </div>

        <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
          <NavItems collapsed={collapsed} unread={unread} />
        </div>

        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            size={collapsed ? 'icon-sm' : 'sm'}
            onClick={onToggleCollapsed}
            fullWidth={!collapsed}
            className={cn(!collapsed && 'justify-start')}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen size={17} />
            ) : (
              <>
                <PanelLeftClose size={17} />
                Collapse
              </>
            )}
          </Button>
        </div>
      </aside>

      {/* ── Mobile drawer ── */}
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 animate-fade-in bg-[var(--overlay)]"
            onClick={onCloseMobile}
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 animate-slide-in-right flex-col border-r border-border bg-surface shadow-2xl">
            <div className="flex h-16 items-center justify-between border-b border-border px-4">
              <Logo collapsed={false} />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onCloseMobile}
                aria-label="Close navigation"
              >
                <X size={18} />
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 scrollbar-thin">
              <NavItems
                collapsed={false}
                unread={unread}
                onNavigate={onCloseMobile}
              />
            </div>
          </aside>
        </div>
      ) : null}
    </>
  )
}
