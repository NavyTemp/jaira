type MaybeUser =
  | { _id: string; name?: string; email?: string }
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

export function formatDate(value?: string | Date | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatDateTime(value?: string | Date | null): string {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}
