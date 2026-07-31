import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Columns3, MessageSquare, Zap } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { Button } from '@/components/ui/Button'
import { Moon, Sun } from 'lucide-react'

const highlights = [
  {
    Icon: Columns3,
    title: 'Boards that stay in sync',
    body: 'Drag tasks between columns and everyone sees it instantly.',
  },
  {
    Icon: MessageSquare,
    title: 'Chat where the work is',
    body: 'Every team and task gets its own realtime thread.',
  },
  {
    Icon: Zap,
    title: 'Never miss an update',
    body: 'Live notifications for assignments, comments and status changes.',
  },
]

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  const { resolved, toggle } = useTheme()

  return (
    <div className="flex min-h-screen bg-bg">
      {/* ── Form pane ── */}
      <div className="flex w-full flex-col px-5 py-8 sm:px-8 lg:w-[52%] lg:px-16">
        <div className="mb-10 flex items-center justify-between">
          <Link to="/login" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 font-bold text-white shadow-sm">
              T
            </span>
            <span className="font-bold tracking-tight text-fg">TaskFlow</span>
          </Link>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggle}
            aria-label="Toggle theme"
          >
            {resolved === 'dark' ? <Moon size={16} /> : <Sun size={16} />}
          </Button>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center">
          <div className="mb-7">
            <h1 className="text-2xl font-bold tracking-tight text-fg sm:text-3xl">
              {title}
            </h1>
            {subtitle ? (
              <p className="mt-1.5 text-sm leading-relaxed text-muted">
                {subtitle}
              </p>
            ) : null}
          </div>

          {children}

          {footer ? <div className="mt-6">{footer}</div> : null}
        </div>

        <p className="mt-10 text-center text-xs text-subtle">
          © {new Date().getFullYear()} TaskFlow — Task Management System
        </p>
      </div>

      {/* ── Marketing pane ── */}
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 lg:block lg:w-[48%]">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 70% 60%, white 1px, transparent 1px)',
            backgroundSize: '48px 48px, 64px 64px',
          }}
        />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-fuchsia-400/20 blur-3xl" />

        <div className="relative flex h-full flex-col justify-center px-14 text-white">
          <h2 className="max-w-md text-3xl font-bold leading-tight tracking-tight">
            Everything your team needs to ship the work that matters.
          </h2>
          <p className="mt-3 max-w-md leading-relaxed text-white/80">
            Tasks, teams, comments, files and chat — in one fast workspace.
          </p>

          <ul className="mt-10 space-y-6">
            {highlights.map(({ Icon, title: t, body }) => (
              <li key={t} className="flex max-w-md gap-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/15 backdrop-blur-sm">
                  <Icon size={20} />
                </span>
                <div>
                  <p className="font-semibold">{t}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-white/75">
                    {body}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-12 flex items-center gap-2 text-sm text-white/75">
            <CheckCircle2 size={16} />
            Realtime by default — powered by Socket.IO
          </div>
        </div>
      </div>
    </div>
  )
}
