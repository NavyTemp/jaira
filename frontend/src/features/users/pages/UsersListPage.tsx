import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BadgeCheck, MessageSquare, Search, Trash2, Users, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Card, PageHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ConfirmDialog } from '@/components/ui/Modal'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { extractApiError } from '@/lib/apiClient'
import { authStorage } from '@/lib/authStorage'
import { formatDate } from '@/lib/format'
import { chatsApi } from '@/features/chats/api/chatsApi'
import { usersApi } from '../api/usersApi'
import type { User } from '../types'

export function UsersListPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const navigate = useNavigate()
  const me = authStorage.getUser()

  const [search, setSearch] = useState('')
  const [pendingDelete, setPendingDelete] = useState<User | null>(null)

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: () => usersApi.list(),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => usersApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] })
      setPendingDelete(null)
      toast.success('User deleted')
    },
    onError: (err) => toast.error(extractApiError(err, 'Could not delete user')),
  })

  const messageMut = useMutation({
    mutationFn: (userId: string) => chatsApi.getOrCreateDirect(userId),
    onSuccess: (chat) => navigate(`/chats?chat=${chat._id}`),
    onError: (err) => toast.error(extractApiError(err, 'Could not open chat')),
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return data ?? []
    return (data ?? []).filter(
      (u) =>
        u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
    )
  }, [data, search])

  return (
    <div>
      <PageHeader
        title="Users"
        description="Administer everyone with access to this workspace."
        icon={<Users size={19} />}
        actions={
          data ? (
            <Badge tone="neutral">
              {data.length} {data.length === 1 ? 'account' : 'accounts'}
            </Badge>
          ) : null
        }
      />

      <Card className="mb-4 p-3 sm:p-3">
        <div className="relative">
          <Search
            size={16}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email…"
            aria-label="Search users"
            className="h-10 w-full rounded-xl border border-border bg-surface-2 pl-9 pr-9 text-sm text-fg transition placeholder:text-subtle hover:border-border-strong focus:border-brand focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand/15"
          />
          {search ? (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-subtle transition hover:bg-surface-3 hover:text-fg"
            >
              <X size={14} />
            </button>
          ) : null}
        </div>
      </Card>

      <Card padded={false}>
        {isError ? (
          <div className="p-5">
            <ErrorState
              message={extractApiError(error, 'Could not load users')}
              onRetry={() => void refetch()}
            />
          </div>
        ) : isLoading ? (
          <div className="px-5">
            <SkeletonList rows={6} />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={24} />}
            title={search ? 'No matching users' : 'No users found'}
            message={
              search ? 'Try a different name or email.' : 'The workspace is empty.'
            }
          />
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((u) => {
              const isMe = u._id === me?._id
              return (
                <li
                  key={u._id}
                  className="flex items-center gap-3 px-4 py-3.5 transition hover:bg-surface-2 sm:px-5"
                >
                  <Avatar
                    name={u.name}
                    seed={u._id}
                    src={u.image?.secure_url}
                    size="md"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-semibold text-fg">
                        {u.name}
                      </p>
                      {isMe ? (
                        <span className="text-xs text-subtle">(you)</span>
                      ) : null}
                    </div>
                    <p className="truncate text-xs text-muted">{u.email}</p>
                    <p className="mt-0.5 text-xs text-subtle">
                      Joined {formatDate(u.createdAt)}
                    </p>
                  </div>

                  <div className="hidden shrink-0 items-center gap-2 sm:flex">
                    <Badge
                      tone={u.role === 'admin' ? 'brand' : 'neutral'}
                      className="capitalize"
                    >
                      {u.role}
                    </Badge>
                    {u.confirm ? (
                      <Badge tone="success">
                        <BadgeCheck size={11} />
                        Verified
                      </Badge>
                    ) : (
                      <Badge tone="warning">Pending</Badge>
                    )}
                    <Badge tone={u.status === 'active' ? 'info' : 'outline'} className="capitalize">
                      {u.status}
                    </Badge>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    {!isMe ? (
                      <>
                        <button
                          onClick={() => messageMut.mutate(u._id)}
                          title="Send a direct message"
                          className="grid h-8 w-8 place-items-center rounded-lg text-subtle transition hover:bg-surface-3 hover:text-fg"
                        >
                          <MessageSquare size={15} />
                        </button>
                        <button
                          onClick={() => setPendingDelete(u)}
                          title="Delete user"
                          className="grid h-8 w-8 place-items-center rounded-lg text-subtle transition hover:bg-danger-soft hover:text-danger"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </Card>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMut.mutate(pendingDelete._id)
        }}
        loading={deleteMut.isPending}
        title="Delete this user?"
        message={
          pendingDelete
            ? `${pendingDelete.name} (${pendingDelete.email}) will lose access immediately.`
            : ''
        }
        confirmLabel="Delete user"
      />
    </div>
  )
}
