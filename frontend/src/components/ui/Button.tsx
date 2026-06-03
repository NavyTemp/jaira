import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const variantClass: Record<Variant, string> = {
  primary:
    'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400',
  secondary:
    'bg-slate-100 text-slate-900 hover:bg-slate-200 disabled:bg-slate-50',
  ghost:
    'bg-transparent text-slate-700 hover:bg-slate-100 disabled:text-slate-400',
  danger:
    'bg-red-600 text-white hover:bg-red-700 disabled:bg-red-300',
}

const sizeClass: Record<Size, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      {...rest}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-md font-medium transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400',
        'disabled:cursor-not-allowed',
        variantClass[variant],
        sizeClass[size],
        className,
      )}
    >
      {loading ? 'Loading…' : children}
    </button>
  )
}
