import { useRef } from 'react'
import { cn } from '@/lib/cn'

const LENGTH = 6

/** Six single-character boxes that behave like one numeric field. */
export function OtpInput({
  value,
  onChange,
  label = 'Verification code',
  error,
  autoFocus = false,
}: {
  value: string
  onChange: (value: string) => void
  label?: string
  error?: string
  autoFocus?: boolean
}) {
  const refs = useRef<Array<HTMLInputElement | null>>([])
  const digits = value.padEnd(LENGTH).slice(0, LENGTH).split('')

  const setDigit = (index: number, digit: string) => {
    const next = digits.map((d, i) => (i === index ? digit : d)).join('').trimEnd()
    onChange(next.replace(/\s/g, ''))
  }

  const focus = (index: number) => {
    refs.current[Math.max(0, Math.min(LENGTH - 1, index))]?.focus()
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-fg">{label}</span>

      <div className="flex gap-2">
        {Array.from({ length: LENGTH }).map((_, i) => (
          <input
            key={i}
            ref={(el) => {
              refs.current[i] = el
            }}
            value={digits[i]?.trim() ?? ''}
            inputMode="numeric"
            autoComplete={i === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            aria-label={`Digit ${i + 1}`}
            autoFocus={autoFocus && i === 0}
            onChange={(e) => {
              const raw = e.target.value.replace(/\D/g, '')
              if (!raw) return setDigit(i, ' ')
              // Typing/pasting several digits fills the boxes to the right.
              if (raw.length > 1) {
                const merged =
                  value.slice(0, i) + raw.slice(0, LENGTH - i)
                onChange(merged.slice(0, LENGTH))
                focus(i + raw.length)
                return
              }
              setDigit(i, raw)
              focus(i + 1)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Backspace') {
                e.preventDefault()
                if (digits[i]?.trim()) setDigit(i, ' ')
                else {
                  setDigit(i - 1, ' ')
                  focus(i - 1)
                }
              }
              if (e.key === 'ArrowLeft') focus(i - 1)
              if (e.key === 'ArrowRight') focus(i + 1)
            }}
            onPaste={(e) => {
              e.preventDefault()
              const pasted = e.clipboardData
                .getData('text')
                .replace(/\D/g, '')
                .slice(0, LENGTH)
              if (pasted) {
                onChange(pasted)
                focus(pasted.length)
              }
            }}
            className={cn(
              'h-13 w-full rounded-xl border bg-surface py-3 text-center text-lg font-semibold text-fg transition',
              'focus:outline-none focus:ring-4 focus:ring-brand/15',
              error
                ? 'border-danger focus:border-danger focus:ring-danger/15'
                : 'border-border hover:border-border-strong focus:border-brand',
            )}
          />
        ))}
      </div>

      {error ? (
        <span className="text-xs font-medium text-danger">{error}</span>
      ) : null}
    </div>
  )
}
