import { forwardRef } from 'react'
import type { ButtonHTMLAttributes } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'soft'
type Size = 'xs' | 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
  fullWidth?: boolean
}

const variantClass: Record<Variant, string> = {
  primary:
    'bg-brand text-brand-fg shadow-sm hover:bg-brand-hover active:translate-y-px disabled:opacity-50',
  secondary:
    'bg-surface-3 text-fg hover:bg-border active:translate-y-px disabled:opacity-50',
  outline:
    'border border-border bg-surface text-fg hover:bg-surface-2 hover:border-border-strong active:translate-y-px disabled:opacity-50',
  ghost:
    'bg-transparent text-muted hover:bg-surface-3 hover:text-fg active:translate-y-px disabled:opacity-50',
  danger:
    'bg-danger text-white shadow-sm hover:bg-danger-hover active:translate-y-px disabled:opacity-50',
  soft:
    'bg-brand-soft text-brand-soft-fg hover:brightness-95 active:translate-y-px disabled:opacity-50 dark:hover:brightness-125',
}

const sizeClass: Record<Size, string> = {
  xs: 'h-7 gap-1.5 px-2.5 text-xs rounded-lg',
  sm: 'h-9 gap-1.5 px-3 text-sm rounded-lg',
  md: 'h-10 gap-2 px-4 text-sm rounded-xl',
  lg: 'h-12 gap-2 px-6 text-base rounded-xl',
  icon: 'h-10 w-10 rounded-xl',
  'icon-sm': 'h-8 w-8 rounded-lg',
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    disabled,
    className,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      {...rest}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        'relative inline-flex shrink-0 items-center justify-center whitespace-nowrap font-medium',
        'transition-[background-color,border-color,color,opacity,transform] duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand',
        'disabled:cursor-not-allowed disabled:active:translate-y-0',
        variantClass[variant],
        sizeClass[size],
        fullWidth && 'w-full',
        className,
      )}
    >
      {loading ? (
        <Loader2
          size={size === 'lg' ? 18 : 15}
          className="animate-spin"
          aria-hidden
        />
      ) : null}
      {children}
    </button>
  )
})
