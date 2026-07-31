import { forwardRef, useId, useState } from 'react'
import type {
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
  TextareaHTMLAttributes,
} from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/cn'

const fieldBase =
  'w-full rounded-xl border border-border bg-surface text-sm text-fg transition ' +
  'placeholder:text-subtle ' +
  'hover:border-border-strong ' +
  'focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15 ' +
  'disabled:cursor-not-allowed disabled:bg-surface-2 disabled:text-muted'

const errorRing =
  'border-danger hover:border-danger focus:border-danger focus:ring-danger/15'

function FieldShell({
  id,
  label,
  error,
  hint,
  children,
}: {
  id: string
  label?: string
  error?: string
  hint?: string
  children: ReactNode
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label ? (
        <label htmlFor={id} className="text-sm font-medium text-fg">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <span className="text-xs font-medium text-danger">{error}</span>
      ) : hint ? (
        <span className="text-xs text-muted">{hint}</span>
      ) : null}
    </div>
  )
}

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  error?: string
  hint?: string
  /** Icon rendered inside the field, on the left. */
  icon?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, className, id, type, ...rest },
  ref,
) {
  const autoId = useId()
  const inputId = id ?? rest.name ?? autoId
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'

  return (
    <FieldShell id={inputId} label={label} error={error} hint={hint}>
      <div className="relative">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle">
            {icon}
          </span>
        ) : null}
        <input
          ref={ref}
          id={inputId}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          {...rest}
          className={cn(
            fieldBase,
            'h-11 px-3.5',
            icon && 'pl-10',
            isPassword && 'pr-10',
            error && errorRing,
            className,
          )}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            tabIndex={-1}
            aria-label={revealed ? 'Hide password' : 'Show password'}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-subtle transition hover:bg-surface-3 hover:text-fg"
          >
            {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        ) : null}
      </div>
    </FieldShell>
  )
})

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  error?: string
  hint?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  function Textarea({ label, error, hint, className, id, ...rest }, ref) {
    const autoId = useId()
    const fieldId = id ?? rest.name ?? autoId
    return (
      <FieldShell id={fieldId} label={label} error={error} hint={hint}>
        <textarea
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          {...rest}
          className={cn(
            fieldBase,
            'min-h-24 resize-y px-3.5 py-2.5 leading-relaxed',
            error && errorRing,
            className,
          )}
        />
      </FieldShell>
    )
  },
)

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  error?: string
  hint?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  function Select({ label, error, hint, className, id, children, ...rest }, ref) {
    const autoId = useId()
    const fieldId = id ?? rest.name ?? autoId
    return (
      <FieldShell id={fieldId} label={label} error={error} hint={hint}>
        <select
          ref={ref}
          id={fieldId}
          aria-invalid={error ? true : undefined}
          {...rest}
          className={cn(
            fieldBase,
            'h-11 cursor-pointer appearance-none bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat pl-3.5 pr-10',
            "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2394a3b8' stroke-width='2.5' stroke-linecap='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")]",
            error && errorRing,
            className,
          )}
        >
          {children}
        </select>
      </FieldShell>
    )
  },
)
