import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type DropdownProps = {
  /** Rendered as the toggle; receives no props. */
  trigger: ReactNode
  children: ReactNode | ((close: () => void) => ReactNode)
  align?: 'left' | 'right'
  className?: string
  panelClassName?: string
}

export function Dropdown({
  trigger,
  children,
  align = 'right',
  className,
  panelClassName,
}: DropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onPointerDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const close = () => setOpen(false)

  return (
    <div ref={ref} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="block"
      >
        {trigger}
      </button>

      {open ? (
        <div
          role="menu"
          className={cn(
            'absolute z-50 mt-2 min-w-52 animate-pop-in overflow-hidden rounded-xl border border-border bg-surface p-1.5 shadow-xl shadow-black/10',
            align === 'right' ? 'right-0' : 'left-0',
            panelClassName,
          )}
        >
          {typeof children === 'function' ? children(close) : children}
        </div>
      ) : null}
    </div>
  )
}

export function DropdownItem({
  children,
  onClick,
  icon,
  danger = false,
  disabled = false,
}: {
  children: ReactNode
  onClick?: () => void
  icon?: ReactNode
  danger?: boolean
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm font-medium transition',
        'disabled:cursor-not-allowed disabled:opacity-50',
        danger
          ? 'text-danger hover:bg-danger-soft'
          : 'text-fg hover:bg-surface-3',
      )}
    >
      {icon ? <span className="shrink-0 text-subtle">{icon}</span> : null}
      <span className="flex-1 truncate">{children}</span>
    </button>
  )
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return (
    <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-subtle">
      {children}
    </p>
  )
}

export function DropdownSeparator() {
  return <div className="my-1.5 h-px bg-border" />
}
