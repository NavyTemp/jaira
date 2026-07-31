import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react'
import type { ReactNode } from 'react'
import { CheckCircle2, Info, TriangleAlert, X, XCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'info' | 'success' | 'error' | 'warning'
type Toast = { id: number; message: string; variant: Variant }

type ToastContextValue = {
  toast: (message: string, variant?: Variant) => void
  success: (message: string) => void
  error: (message: string) => void
}

const noop = () => {}
const ToastContext = createContext<ToastContextValue>({
  toast: noop,
  success: noop,
  error: noop,
})

const styles: Record<Variant, { wrap: string; Icon: typeof Info }> = {
  info: { wrap: 'border-border bg-surface text-fg', Icon: Info },
  success: {
    wrap: 'border-success/30 bg-success-soft text-success-soft-fg',
    Icon: CheckCircle2,
  },
  error: {
    wrap: 'border-danger/30 bg-danger-soft text-danger-soft-fg',
    Icon: XCircle,
  },
  warning: {
    wrap: 'border-warning/30 bg-warning-soft text-warning-soft-fg',
    Icon: TriangleAlert,
  },
}

let counter = 0

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    (message: string, variant: Variant = 'info') => {
      const id = ++counter
      setToasts((prev) => [...prev.slice(-4), { id, message, variant }])
      setTimeout(() => dismiss(id), 4500)
    },
    [dismiss],
  )

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (m: string) => toast(m, 'success'),
      error: (m: string) => toast(m, 'error'),
    }),
    [toast],
  )

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2"
        role="region"
        aria-live="polite"
      >
        {toasts.map((t) => {
          const { wrap, Icon } = styles[t.variant]
          return (
            <div
              key={t.id}
              className={cn(
                'pointer-events-auto flex animate-slide-in-right items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm shadow-lg shadow-black/10',
                wrap,
              )}
            >
              <Icon size={17} className="mt-px shrink-0" />
              <span className="flex-1 leading-snug">{t.message}</span>
              <button
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss"
                className="-mr-1 -mt-0.5 shrink-0 rounded p-1 opacity-60 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
              >
                <X size={14} />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  return useContext(ToastContext)
}
