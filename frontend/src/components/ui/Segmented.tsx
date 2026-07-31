import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type SegmentedOption<T extends string> = {
  value: T
  label: string
  icon?: ReactNode
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  className,
  size = 'md',
}: {
  value: T
  onChange: (value: T) => void
  options: Array<SegmentedOption<T>>
  className?: string
  size?: 'sm' | 'md'
}) {
  return (
    <div
      role="tablist"
      className={cn(
        'inline-flex items-center gap-1 rounded-xl border border-border bg-surface-2 p-1',
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value
        return (
          <button
            key={opt.value}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-lg font-medium transition',
              size === 'sm' ? 'h-7 px-2.5 text-xs' : 'h-8 px-3 text-sm',
              active
                ? 'bg-surface text-fg shadow-sm'
                : 'text-muted hover:text-fg',
            )}
          >
            {opt.icon}
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}
