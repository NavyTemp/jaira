import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  Check,
  CheckSquare,
  LogOut,
  Menu,
  Monitor,
  Moon,
  Search,
  Settings,
  Sun,
  UserCircle,
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Avatar } from '@/components/ui/Avatar'
import {
  Dropdown,
  DropdownItem,
  DropdownLabel,
  DropdownSeparator,
} from '@/components/ui/Dropdown'
import { authStorage } from '@/lib/authStorage'
import { authApi } from '@/features/auth/api/authApi'
import { notificationsApi } from '@/features/notifications/api/notificationsApi'
import { usersApi } from '@/features/users/api/usersApi'
import { useSocket } from '@/lib/SocketContext'
import { useTheme } from '@/lib/ThemeContext'
import type { Theme } from '@/lib/ThemeContext'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'

function LiveDot() {
  const { connected } = useSocket()
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold',
        connected
          ? 'bg-success-soft text-success-soft-fg'
          : 'bg-surface-3 text-muted',
      )}
      title={connected ? 'Realtime connected' : 'Realtime offline'}
    >
      <span className="relative flex h-1.5 w-1.5">
        {connected ? (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
        ) : null}
        <span
          className={cn(
            'relative inline-flex h-1.5 w-1.5 rounded-full',
            connected ? 'bg-success' : 'bg-subtle',
          )}
        />
      </span>
      <span className="hidden sm:inline">{connected ? 'Live' : 'Offline'}</span>
    </span>
  )
}

function ThemeToggle() {
  const { theme, resolved, setTheme } = useTheme()
  const options: Array<{ value: Theme; label: string; icon: typeof Sun }> = [
    { value: 'light', label: 'Light', icon: Sun },
    { value: 'dark', label: 'Dark', icon: Moon },
    { value: 'system', label: 'System', icon: Monitor },
  ]

  return (
    <Dropdown
      trigger={
        <span
          className="grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-surface-3 hover:text-fg"
          title="Change theme"
        >
          {resolved === 'dark' ? <Moon size={17} /> : <Sun size={17} />}
        </span>
      }
      panelClassName="min-w-44"
    >
      {(close) => (
        <>
          <DropdownLabel>Appearance</DropdownLabel>
          {options.map(({ value, label, icon: Icon }) => (
            <DropdownItem
              key={value}
              icon={<Icon size={16} />}
              onClick={() => {
                setTheme(value)
                close()
              }}
            >
              <span className="flex items-center justify-between">
                {label}
                {theme === value ? (
                  <Check size={14} className="text-brand" />
                ) : null}
              </span>
            </DropdownItem>
          ))}
        </>
      )}
    </Dropdown>
  )
}

function NotificationBell() {
  const qc = useQueryClient()
  const navigate = useNavigate()

  const { data } = useQuery({
    queryKey: ['notifications', 'bell'],
    queryFn: () => notificationsApi.list({ limit: 6 }),
    refetchOnWindowFocus: true,
  })

  const markAll = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const markOne = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = data?.unreadCount ?? 0
  const list = data?.notifications ?? []

  return (
    <Dropdown
      trigger={
        <span
          className="relative grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-surface-3 hover:text-fg"
          title="Notifications"
        >
          <Bell size={17} />
          {unread > 0 ? (
            <span className="absolute right-1 top-1 grid min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold leading-4 text-white">
              {unread > 9 ? '9+' : unread}
            </span>
          ) : null}
        </span>
      }
      panelClassName="w-80 p-0"
    >
      {(close) => (
        <>
          <div className="flex items-center justify-between border-b border-border px-3.5 py-3">
            <p className="text-sm font-semibold text-fg">Notifications</p>
            {unread > 0 ? (
              <button
                onClick={() => markAll.mutate()}
                className="text-xs font-semibold text-brand hover:underline"
              >
                Mark all read
              </button>
            ) : null}
          </div>

          <div className="max-h-80 overflow-y-auto scrollbar-thin">
            {list.length === 0 ? (
              <p className="px-3.5 py-8 text-center text-sm text-muted">
                You're all caught up.
              </p>
            ) : (
              list.map((n) => (
                <button
                  key={n._id}
                  onClick={() => {
                    if (!n.isRead) markOne.mutate(n._id)
                    close()
                    navigate('/notifications')
                  }}
                  className="flex w-full gap-2.5 border-b border-border px-3.5 py-3 text-left transition last:border-0 hover:bg-surface-2"
                >
                  <span
                    className={cn(
                      'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                      n.isRead ? 'bg-transparent' : 'bg-brand',
                    )}
                  />
                  <span className="min-w-0 flex-1">
                    <span
                      className={cn(
                        'block text-sm leading-snug',
                        n.isRead ? 'text-muted' : 'font-medium text-fg',
                      )}
                    >
                      {n.message}
                    </span>
                    <span className="mt-0.5 block text-xs text-subtle">
                      {relativeTime(n.createdAt)}
                    </span>
                  </span>
                </button>
              ))
            )}
          </div>

          <Link
            to="/notifications"
            onClick={close}
            className="block border-t border-border px-3.5 py-2.5 text-center text-xs font-semibold text-brand hover:bg-surface-2"
          >
            View all notifications
          </Link>
        </>
      )}
    </Dropdown>
  )
}

function QuickSearch() {
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  // ⌘K / Ctrl+K focuses search from anywhere.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        inputRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        navigate(q.trim() ? `/tasks?q=${encodeURIComponent(q.trim())}` : '/tasks')
      }}
      className="relative hidden flex-1 max-w-md sm:block"
    >
      <Search
        size={16}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
      />
      <input
        ref={inputRef}
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search tasks…"
        aria-label="Search tasks"
        className="h-9 w-full rounded-xl border border-border bg-surface-2 pl-9 pr-14 text-sm text-fg transition placeholder:text-subtle hover:border-border-strong focus:border-brand focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand/15"
      />
      <kbd className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-border bg-surface px-1.5 py-0.5 text-[10px] font-medium text-subtle md:block">
        ⌘K
      </kbd>
    </form>
  )
}

export function Header({ onOpenMobileNav }: { onOpenMobileNav: () => void }) {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const stored = authStorage.getUser()

  // Keeps the avatar fresh after an image upload.
  const { data: me } = useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.me(),
    staleTime: 60_000,
  })

  const onLogout = async () => {
    try {
      await authApi.logout()
    } catch {
      /* best-effort server-side revoke */
    }
    authStorage.clear()
    qc.clear()
    navigate('/login', { replace: true })
  }

  const name = me?.name ?? stored?.name ?? 'User'
  const email = me?.email ?? stored?.email ?? ''
  const role = me?.role ?? stored?.role ?? 'user'

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b border-border bg-surface/80 px-3 backdrop-blur-md sm:gap-3 sm:px-5">
      <Button
        variant="ghost"
        size="icon-sm"
        onClick={onOpenMobileNav}
        className="md:hidden"
        aria-label="Open navigation"
      >
        <Menu size={19} />
      </Button>

      <QuickSearch />

      <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
        <LiveDot />
        <ThemeToggle />
        <NotificationBell />

        <div className="mx-1 hidden h-6 w-px bg-border sm:block" />

        <Dropdown
          trigger={
            <span className="flex items-center gap-2 rounded-xl p-1 pr-2 transition hover:bg-surface-3">
              <Avatar
                name={name}
                seed={me?._id ?? stored?._id}
                src={me?.image?.secure_url}
                size="sm"
              />
              <span className="hidden text-left leading-tight lg:block">
                <span className="block max-w-32 truncate text-sm font-semibold text-fg">
                  {name}
                </span>
                <span className="block text-[11px] capitalize text-subtle">
                  {role}
                </span>
              </span>
            </span>
          }
        >
          {(close) => (
            <>
              <div className="px-2.5 py-2">
                <p className="truncate text-sm font-semibold text-fg">{name}</p>
                <p className="truncate text-xs text-muted">{email}</p>
              </div>
              <DropdownSeparator />
              <DropdownItem
                icon={<UserCircle size={16} />}
                onClick={() => {
                  close()
                  navigate('/profile')
                }}
              >
                My profile
              </DropdownItem>
              <DropdownItem
                icon={<CheckSquare size={16} />}
                onClick={() => {
                  close()
                  navigate('/tasks')
                }}
              >
                My tasks
              </DropdownItem>
              {role === 'admin' ? (
                <DropdownItem
                  icon={<Settings size={16} />}
                  onClick={() => {
                    close()
                    navigate('/users')
                  }}
                >
                  Manage users
                </DropdownItem>
              ) : null}
              <DropdownSeparator />
              <DropdownItem
                icon={<LogOut size={16} />}
                danger
                onClick={() => {
                  close()
                  void onLogout()
                }}
              >
                Sign out
              </DropdownItem>
            </>
          )}
        </Dropdown>
      </div>
    </header>
  )
}
