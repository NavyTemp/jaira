import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { extractApiError } from '@/lib/apiClient'
import { formatDateTime } from '@/lib/format'
import { notificationsApi } from '../api/notificationsApi'

export function NotificationsPage() {
  const qc = useQueryClient()

  const { data, isLoading, error } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationsApi.list(),
  })

  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ['notifications'] })

  const readMut = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: invalidate,
  })
  const readAllMut = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: invalidate,
  })
  const delMut = useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: invalidate,
  })

  const notifications = data?.notifications ?? []

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => readAllMut.mutate()}
          loading={readAllMut.isPending}
          disabled={!data?.unreadCount}
        >
          Mark all read
        </Button>
      </CardHeader>

      {isLoading ? <p className="text-sm text-slate-500">Loading…</p> : null}
      {error ? (
        <p className="text-sm text-red-600">{extractApiError(error)}</p>
      ) : null}

      {!isLoading && notifications.length === 0 ? (
        <p className="text-sm text-slate-500">You're all caught up.</p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {notifications.map((n) => (
            <li
              key={n._id}
              className={
                'flex items-center justify-between gap-3 py-3 ' +
                (n.isRead ? '' : 'bg-blue-50/40')
              }
            >
              <div className="min-w-0">
                <p className="text-sm text-slate-900">{n.message}</p>
                <p className="text-xs text-slate-400">
                  {n.type} · {formatDateTime(n.createdAt)}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {!n.isRead ? (
                  <button
                    onClick={() => readMut.mutate(n._id)}
                    className="text-xs text-slate-600 hover:underline"
                  >
                    mark read
                  </button>
                ) : null}
                <button
                  onClick={() => delMut.mutate(n._id)}
                  className="text-xs text-red-500 hover:underline"
                >
                  delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Card>
  )
}
