import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Button } from './Button'

type Size = 'sm' | 'md' | 'lg' | 'xl'

const sizeClass: Record<Size, string> = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

type ModalProps = {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  size?: Size
  children: ReactNode
  footer?: ReactNode
}

export function Modal({
  open,
  onClose,
  title,
  description,
  size = 'md',
  children,
  footer,
}: ModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="fixed inset-0 animate-fade-in bg-[var(--overlay)] backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative z-10 my-0 w-full animate-pop-in rounded-t-2xl border border-border bg-surface shadow-2xl sm:my-8 sm:rounded-2xl',
          sizeClass[size],
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-base font-semibold tracking-tight text-fg">
              {title}
            </h2>
            {description ? (
              <p className="mt-0.5 text-sm text-muted">{description}</p>
            ) : null}
          </div>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close dialog"
            className="-mr-1.5 -mt-0.5"
          >
            <X size={17} />
          </Button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto px-5 py-5 scrollbar-thin">
          {children}
        </div>

        {footer ? (
          <div className="flex justify-end gap-2 border-t border-border bg-surface-2 px-5 py-3.5">
            {footer}
          </div>
        ) : null}
      </div>
    </div>,
    document.body,
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  loading = false,
  destructive = true,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  loading?: boolean
  destructive?: boolean
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant={destructive ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      <p className="text-sm leading-relaxed text-muted">{message}</p>
    </Modal>
  )
}
