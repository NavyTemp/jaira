import { cn } from '@/lib/cn'
import { Card } from './Card'

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('skeleton rounded-md', className)} />
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number
  className?: string
}) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn('h-3.5', i === lines - 1 ? 'w-2/5' : 'w-full')}
        />
      ))}
    </div>
  )
}

/** Placeholder rows matching the task/team list layout. */
export function SkeletonList({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-border">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 py-3.5">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-1/3" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
      ))}
    </div>
  )
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="space-y-3">
          <Skeleton className="h-9 w-9 rounded-xl" />
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-3 w-24" />
        </Card>
      ))}
    </div>
  )
}
