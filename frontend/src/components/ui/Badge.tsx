import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'
import {
  PRIORITY_LABEL,
  STATUS_DOT,
  STATUS_LABEL,
} from '@/features/tasks/constants'
import type { TaskPriority, TaskStatus } from '@/features/tasks/types'

type Tone =
  | 'neutral'
  | 'brand'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'outline'

const toneClass: Record<Tone, string> = {
  neutral: 'bg-surface-3 text-muted',
  brand: 'bg-brand-soft text-brand-soft-fg',
  success: 'bg-success-soft text-success-soft-fg',
  warning: 'bg-warning-soft text-warning-soft-fg',
  danger: 'bg-danger-soft text-danger-soft-fg',
  info: 'bg-info-soft text-info-soft-fg',
  outline: 'border border-border text-muted',
}

export function Badge({
  tone = 'neutral',
  className,
  children,
  ...rest
}: HTMLAttributes<HTMLSpanElement> & { tone?: Tone; children: ReactNode }) {
  return (
    <span
      {...rest}
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold',
        toneClass[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}

const statusTone: Record<TaskStatus, Tone> = {
  todo: 'neutral',
  in_progress: 'info',
  review: 'warning',
  done: 'success',
}

export function StatusBadge({
  status,
  className,
}: {
  status: TaskStatus
  className?: string
}) {
  return (
    <Badge tone={statusTone[status]} className={className}>
      <span className={cn('h-1.5 w-1.5 rounded-full', STATUS_DOT[status])} />
      {STATUS_LABEL[status]}
    </Badge>
  )
}

const priorityTone: Record<TaskPriority, Tone> = {
  low: 'neutral',
  medium: 'info',
  high: 'warning',
  urgent: 'danger',
}

export function PriorityBadge({
  priority,
  className,
}: {
  priority: TaskPriority
  className?: string
}) {
  return (
    <Badge tone={priorityTone[priority]} className={className}>
      {PRIORITY_LABEL[priority]}
    </Badge>
  )
}
