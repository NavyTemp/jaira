import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function EmptyState({
  icon,
  title,
  message,
  action,
  className,
  compact = false,
}: {
  icon?: ReactNode
  title: string
  message?: string
  action?: ReactNode
  className?: string
  compact?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8' : 'py-14',
        className,
      )}
    >
      {icon ? (
        <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-surface-3 text-subtle">
          {icon}
        </div>
      ) : null}
      <p className="text-sm font-semibold text-fg">{title}</p>
      {message ? (
        <p className="mt-1 max-w-sm text-sm leading-relaxed text-muted">
          {message}
        </p>
      ) : null}
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  )
}

export function ErrorState({
  message,
  onRetry,
}: {
  message: string
  onRetry?: () => void
}) {
  return (
    <div className="rounded-xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-danger-soft-fg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span>{message}</span>
        {onRetry ? (
          <button
            onClick={onRetry}
            className="shrink-0 font-semibold underline underline-offset-2 hover:no-underline"
          >
            Retry
          </button>
        ) : null}
      </div>
    </div>
  )
}
