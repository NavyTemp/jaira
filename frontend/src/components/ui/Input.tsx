import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, className, id, ...rest },
  ref,
) {
  const inputId = id ?? rest.name
  return (
    <label className="flex flex-col gap-1 text-sm" htmlFor={inputId}>
      {label ? (
        <span className="font-medium text-slate-700">{label}</span>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        {...rest}
        className={cn(
          'h-10 rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-900',
          'placeholder:text-slate-400',
          'focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200',
          error && 'border-red-500 focus:border-red-500 focus:ring-red-200',
          className,
        )}
      />
      {error ? <span className="text-xs text-red-600">{error}</span> : null}
    </label>
  )
})
