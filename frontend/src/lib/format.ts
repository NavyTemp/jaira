type MaybeUser =
  | { _id: string; name?: string; email?: string; image?: { secure_url?: string } }
  | string
  | null
  | undefined

/** Render a user reference whether it's populated or just an id. */
export function displayUser(u: MaybeUser): string {
  if (!u) return 'Unknown'
  if (typeof u === 'string') return u
  return u.name || u.email || u._id
}

export function userId(u: MaybeUser): string {
  if (!u) return ''
  return typeof u === 'string' ? u : u._id
}

/** Populated users only — used to feed avatar components. */
export function populatedUsers(
  list: Array<MaybeUser>,
): Array<{ _id: string; name?: string; image?: { secure_url?: string } }> {
  return list.flatMap((u) =>
    u && typeof u === 'object'
      ? [{ _id: u._id, name: u.name, image: u.image }]
      : [],
  )
}

export function formatDate(value?: string | Date | null): string {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(value?: string | Date | null): string {
  const d = toDate(value)
  if (!d) return '—'
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatTime(value?: string | Date | null): string {
  const d = toDate(value)
  if (!d) return ''
  return d.toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/** "just now" / "5m ago" / "3d ago", falling back to a date past a week. */
export function relativeTime(value?: string | Date | null): string {
  const d = toDate(value)
  if (!d) return '—'

  const seconds = Math.round((Date.now() - d.getTime()) / 1000)
  if (seconds < 45) return 'just now'
  if (seconds < 90) return '1m ago'

  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.round(hours / 24)
  if (days < 7) return `${days}d ago`

  return formatDate(d)
}

export type DueState = 'none' | 'overdue' | 'today' | 'soon' | 'later'

/** Classify a due date so lists can highlight what needs attention. */
export function dueState(value?: string | Date | null): DueState {
  const d = toDate(value)
  if (!d) return 'none'

  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)
  const dayMs = 86_400_000
  const diffDays = Math.floor((d.getTime() - startOfToday.getTime()) / dayMs)

  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'today'
  if (diffDays <= 3) return 'soon'
  return 'later'
}

export function dueLabel(value?: string | Date | null): string {
  const state = dueState(value)
  if (state === 'none') return 'No due date'
  if (state === 'today') return 'Due today'
  if (state === 'overdue') return `Overdue · ${formatDate(value)}`
  return `Due ${formatDate(value)}`
}

export function formatBytes(bytes?: number): string {
  if (!bytes || bytes < 0) return '—'
  const units = ['B', 'KB', 'MB', 'GB']
  let i = 0
  let n = bytes
  while (n >= 1024 && i < units.length - 1) {
    n /= 1024
    i++
  }
  return `${n < 10 && i > 0 ? n.toFixed(1) : Math.round(n)} ${units[i]}`
}

/** Best-effort filename from a Cloudinary/URL path. */
export function fileNameFromUrl(url: string): string {
  try {
    const path = new URL(url, window.location.origin).pathname
    return decodeURIComponent(path.split('/').pop() || 'file')
  } catch {
    return url.split('/').pop() || 'file'
  }
}

export function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|gif|webp|avif|svg|bmp)(\?|$)/i.test(url)
}

function toDate(value?: string | Date | null): Date | null {
  if (!value) return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}
