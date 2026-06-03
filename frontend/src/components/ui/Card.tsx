import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type CardProps = HTMLAttributes<HTMLDivElement>

export function Card({ className, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={cn(
        'rounded-lg border border-slate-200 bg-white p-6 shadow-sm',
        className,
      )}
    />
  )
}

export function CardHeader({ className, ...rest }: CardProps) {
  return (
    <div
      {...rest}
      className={cn('mb-4 flex items-center justify-between', className)}
    />
  )
}

export function CardTitle({ className, ...rest }: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      {...rest}
      className={cn('text-lg font-semibold text-slate-900', className)}
    />
  )
}
