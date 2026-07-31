import { cn } from '@/lib/cn'

type Size = 'xs' | 'sm' | 'md' | 'lg' | 'xl'

const sizeClass: Record<Size, string> = {
  xs: 'h-6 w-6 text-[10px]',
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
  xl: 'h-20 w-20 text-xl',
}

/** Deterministic gradient per user, so the same person keeps the same colour. */
const gradients = [
  'from-indigo-500 to-violet-500',
  'from-sky-500 to-blue-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-pink-500 to-rose-600',
  'from-fuchsia-500 to-purple-600',
  'from-cyan-500 to-sky-600',
  'from-lime-500 to-green-600',
]

function hashIndex(seed: string, buckets: number): number {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return Math.abs(h) % buckets
}

function initialsOf(name?: string): string {
  if (!name?.trim()) return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function Avatar({
  name,
  src,
  size = 'md',
  seed,
  className,
  ring = false,
}: {
  name?: string
  src?: string | null
  size?: Size
  /** Overrides the colour seed (defaults to `name`). */
  seed?: string
  className?: string
  ring?: boolean
}) {
  const gradient = gradients[hashIndex(seed ?? name ?? '?', gradients.length)]

  return (
    <span
      className={cn(
        'relative inline-grid shrink-0 select-none place-items-center overflow-hidden rounded-full font-semibold text-white',
        !src && `bg-gradient-to-br ${gradient}`,
        ring && 'ring-2 ring-surface',
        sizeClass[size],
        className,
      )}
      title={name}
    >
      {src ? (
        <img
          src={src}
          alt={name ?? 'Avatar'}
          className="h-full w-full object-cover"
          loading="lazy"
        />
      ) : (
        initialsOf(name)
      )}
    </span>
  )
}

/** Overlapping avatar row with a `+N` overflow chip. */
export function AvatarGroup({
  users,
  max = 4,
  size = 'sm',
}: {
  users: Array<{ _id: string; name?: string; image?: { secure_url?: string } }>
  max?: number
  size?: Size
}) {
  if (users.length === 0) return <span className="text-sm text-subtle">—</span>

  const shown = users.slice(0, max)
  const rest = users.length - shown.length

  return (
    <div className="flex items-center">
      {shown.map((u) => (
        <Avatar
          key={u._id}
          name={u.name}
          seed={u._id}
          src={u.image?.secure_url}
          size={size}
          ring
          className="-ml-1.5 first:ml-0"
        />
      ))}
      {rest > 0 ? (
        <span
          className={cn(
            '-ml-1.5 inline-grid place-items-center rounded-full bg-surface-3 font-semibold text-muted ring-2 ring-surface',
            sizeClass[size],
          )}
        >
          +{rest}
        </span>
      ) : null}
    </div>
  )
}
