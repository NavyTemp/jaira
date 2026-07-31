import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type DivProps = HTMLAttributes<HTMLDivElement>

export function Card({
  className,
  padded = true,
  ...rest
}: DivProps & { padded?: boolean }) {
  return (
    <div
      {...rest}
      className={cn(
        'rounded-2xl border border-border bg-surface shadow-sm shadow-black/[0.03]',
        padded && 'p-5 sm:p-6',
        className,
      )}
    />
  )
}

export function CardHeader({ className, ...rest }: DivProps) {
  return (
    <div
      {...rest}
      className={cn(
        'mb-5 flex flex-wrap items-center justify-between gap-3',
        className,
      )}
    />
  )
}

export function CardTitle({
  className,
  ...rest
}: HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      {...rest}
      className={cn('text-base font-semibold tracking-tight text-fg', className)}
    />
  )
}

export function CardDescription({
  className,
  ...rest
}: HTMLAttributes<HTMLParagraphElement>) {
  return <p {...rest} className={cn('text-sm text-muted', className)} />
}

/** Page-level title block with optional actions on the right. */
export function PageHeader({
  title,
  description,
  icon,
  actions,
}: {
  title: string
  description?: string
  icon?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon ? (
          <span className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand-soft-fg">
            {icon}
          </span>
        ) : null}
        <div>
          <h1 className="text-xl font-bold tracking-tight text-fg sm:text-2xl">
            {title}
          </h1>
          {description ? (
            <p className="mt-0.5 text-sm text-muted">{description}</p>
          ) : null}
        </div>
      </div>
      {actions ? (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
