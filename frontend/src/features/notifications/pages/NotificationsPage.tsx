import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Bell,
  CheckCheck,
  CheckSquare,
  MessageSquare,
  Settings,
  Trash2,
  UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, PageHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Segmented } from '@/components/ui/Segmented'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { extractApiError } from '@/lib/apiClient'
import { relativeTime } from '@/lib/format'
import { notificationsApi } from '../api/notificationsApi'
import type { Notification, NotificationType } from '../types'

const typeMeta: Record<NotificationType, { Icon: LucideIcon; tone: string; label: string }> =
  {
    task: {
      Icon: CheckSquare,
      tone: 'bg-brand-soft text-brand-soft-fg',
      label: 'Task',
    },
    team: {
      Icon: UsersRound,
      tone: 'bg-info-soft text-info-soft-fg',
      label: 'Team',
    },
    chat: {
      Icon: MessageSquare,
      tone: 'bg-success-soft text-success-soft-fg',
      label: 'Chat',
    },
    system: {
      Icon: Settings,
      tone: 'bg-surface-3 text-muted',
      label: 'System',
    },
  }

/** Notifications carry a `relatedId`, so we can deep-link by type. */
function linkFor(n: Notification): string | null {
  if (!n.relatedId) return null
  if (n.type === 'task') return `/tasks/${n.relatedId}`
  if (n.type === 'team') return `/teams/${n.relatedId}`
  if (n.type === 'chat') return `/chats?chat=${n.relatedId}`
  return null
}

export function NotificationsPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['notifications', 'list', filter],
    queryFn: () =>
      notificationsApi.list(
        filter === 'unread' ? { unread: true, limit: 50 } : { limit: 50 },
      ),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['notifications'] })

  const readMut = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: invalidate,
    onError: (err) => toast.error(extractApiError(err, 'Could not mark as read')),
  })

  const readAllMut = useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      invalidate()
      toast.success('All notifications marked as read')
    },
    onError: (err) => toast.error(extractApiError(err, 'Could not mark all read')),
  })

  const delMut = useMutation({
    mutationFn: (id: string) => notificationsApi.remove(id),
    onSuccess: invalidate,
    onError: (err) => toast.error(extractApiError(err, 'Could not delete')),
  })

  const notifications = data?.notifications ?? []
  const unreadCount = data?.unreadCount ?? 0

  return (
    <div>
      <PageHeader
        title="Notifications"
        description="Everything that happened while you were away."
        icon={<Bell size={19} />}
        actions={
          <>
            <Segmented
              value={filter}
              onChange={setFilter}
              options={[
                { value: 'all', label: 'All' },
                { value: 'unread', label: `Unread${unreadCount ? ` (${unreadCount})` : ''}` },
              ]}
            />
            <Button
              size="sm"
              variant="outline"
              onClick={() => readAllMut.mutate()}
              loading={readAllMut.isPending}
              disabled={!unreadCount}
            >
              <CheckCheck size={15} />
              Mark all read
            </Button>
          </>
        }
      />

      <Card padded={false}>
        {isError ? (
          <div className="p-5">
            <ErrorState
              message={extractApiError(error, 'Could not load notifications')}
              onRetry={() => void refetch()}
            />
          </div>
        ) : isLoading ? (
          <div className="px-5">
            <SkeletonList rows={6} />
          </div>
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={24} />}
            title={filter === 'unread' ? 'No unread notifications' : "You're all caught up"}
            message={
              filter === 'unread'
                ? 'Everything has been read. Switch to "All" to see your history.'
                : 'Assignments, comments and team updates will show up here.'
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {notifications.map((n) => {
              const { Icon, tone, label } = typeMeta[n.type] ?? typeMeta.system
              const href = linkFor(n)

              const body = (
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      'grid h-9 w-9 shrink-0 place-items-center rounded-xl',
                      tone,
                    )}
                  >
                    <Icon size={16} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        'text-sm leading-snug',
                        n.isRead ? 'text-muted' : 'font-semibold text-fg',
                      )}
                    >
                      {n.message}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <Badge tone="outline">{label}</Badge>
                      <span className="text-xs text-subtle">
                        {relativeTime(n.createdAt)}
                      </span>
                      {!n.isRead ? (
                        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                      ) : null}
                    </div>
                  </div>
                </div>
              )

              return (
                <li
                  key={n._id}
                  className={cn(
                    'group flex items-center gap-3 px-4 py-3.5 transition sm:px-5',
                    n.isRead ? 'hover:bg-surface-2' : 'bg-brand-soft/25 hover:bg-brand-soft/40',
                  )}
                >
                  <div className="min-w-0 flex-1">
                    {href ? (
                      <Link
                        to={href}
                        onClick={() => {
                          if (!n.isRead) readMut.mutate(n._id)
                        }}
                        className="block"
                      >
                        {body}
                      </Link>
                    ) : (
                      body
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    {!n.isRead ? (
                      <button
                        onClick={() => readMut.mutate(n._id)}
                        title="Mark as read"
                        className="grid h-8 w-8 place-items-center rounded-lg text-subtle transition hover:bg-surface-3 hover:text-fg"
                      >
                        <CheckCheck size={15} />
                      </button>
                    ) : null}
                    <button
                      onClick={() => delMut.mutate(n._id)}
                      title="Delete notification"
                      className="grid h-8 w-8 place-items-center rounded-lg text-subtle transition hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>
    </div>
  )
}
