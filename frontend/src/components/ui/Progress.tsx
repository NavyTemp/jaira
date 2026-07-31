import { cn } from '@/lib/cn'

export function Progress({
  value,
  max = 100,
  className,
  barClassName,
  label,
}: {
  value: number
  max?: number
  className?: string
  barClassName?: string
  label?: string
}) {
  const pct = max <= 0 ? 0 : Math.min(100, Math.max(0, (value / max) * 100))
  return (
    <div
      className={cn('h-2 w-full overflow-hidden rounded-full bg-surface-3', className)}
      role="progressbar"
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label}
    >
      <div
        className={cn(
          'h-full rounded-full bg-brand transition-[width] duration-500 ease-out',
          barClassName,
        )}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}
