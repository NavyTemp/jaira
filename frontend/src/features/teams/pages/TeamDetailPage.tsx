import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Crown,
  ListChecks,
  LogOut,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Plus,
  Shield,
  Trash2,
  UserMinus,
  UserPlus,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { ConfirmDialog, Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { Badge, StatusBadge } from '@/components/ui/Badge'
import { ImagePicker } from '@/components/ui/ImagePicker'
import {
  Dropdown,
  DropdownItem,
  DropdownSeparator,
} from '@/components/ui/Dropdown'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Skeleton, SkeletonList } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { extractApiError } from '@/lib/apiClient'
import { authStorage } from '@/lib/authStorage'
import { displayUser, userId } from '@/lib/format'
import { usersApi } from '@/features/users/api/usersApi'
import { teamsApi } from '../api/teamsApi'
import type { TeamMemberRole } from '../types'
import type { TaskStatus } from '@/features/tasks/types'

type TaskRef = { _id: string; title: string; status?: TaskStatus }

export function TeamDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const toast = useToast()
  const me = authStorage.getUser()
  const isAdmin = authStorage.getRole() === 'admin'

  const [addOpen, setAddOpen] = useState(false)
  const [editOpen, setEditOpen] = useState(false)
  const [newUserId, setNewUserId] = useState('')
  const [newRole, setNewRole] = useState<TeamMemberRole>('member')
  const [addError, setAddError] = useState<string | null>(null)

  const [editName, setEditName] = useState('')
  const [editDescription, setEditDescription] = useState('')
  const [editError, setEditError] = useState<string | null>(null)

  const [confirm, setConfirm] = useState<
    | { kind: 'delete' }
    | { kind: 'leave' }
    | { kind: 'remove'; userId: string; name: string }
    | { kind: 'transfer'; userId: string; name: string }
    | null
  >(null)

  const {
    data: team,
    isLoading,
    isError,
    error: loadError,
    refetch,
  } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamsApi.getOne(id),
    enabled: !!id,
  })

  // Only admins may list users, so the picker is admin-only.
  const { data: allUsers } = useQuery({
    queryKey: ['users'],
    queryFn: () => usersApi.list(),
    enabled: addOpen && isAdmin,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['team', id] })
    qc.invalidateQueries({ queryKey: ['teams'] })
  }

  const onError = (fallback: string) => (err: unknown) =>
    toast.error(extractApiError(err, fallback))

  const addMut = useMutation({
    mutationFn: () => teamsApi.addMember(id, newUserId.trim(), newRole),
    onSuccess: () => {
      setNewUserId('')
      setAddOpen(false)
      invalidate()
      toast.success('Member added')
    },
    onError: (err) => setAddError(extractApiError(err, 'Could not add member')),
  })

  const updateMut = useMutation({
    mutationFn: () =>
      teamsApi.update(id, {
        name: editName.trim(),
        description: editDescription.trim(),
      }),
    onSuccess: () => {
      setEditOpen(false)
      invalidate()
      toast.success('Team updated')
    },
    onError: (err) => setEditError(extractApiError(err, 'Could not update team')),
  })

  const removeMut = useMutation({
    mutationFn: (uid: string) => teamsApi.removeMember(id, uid),
    onSuccess: () => {
      setConfirm(null)
      invalidate()
      toast.success('Member removed')
    },
    onError: onError('Could not remove member'),
  })

  const roleMut = useMutation({
    mutationFn: (args: { userId: string; role: TeamMemberRole }) =>
      teamsApi.changeMemberRole(id, args.userId, args.role),
    onSuccess: () => {
      invalidate()
      toast.success('Role updated')
    },
    onError: onError('Could not change role'),
  })

  const transferMut = useMutation({
    mutationFn: (uid: string) => teamsApi.transferOwnership(id, uid),
    onSuccess: () => {
      setConfirm(null)
      invalidate()
      toast.success('Ownership transferred')
    },
    onError: onError('Could not transfer ownership'),
  })

  const leaveMut = useMutation({
    mutationFn: () => teamsApi.leave(id),
    onSuccess: () => {
      invalidate()
      toast.success('You left the team')
      navigate('/teams', { replace: true })
    },
    onError: onError('Could not leave team'),
  })

  const deleteMut = useMutation({
    mutationFn: () => teamsApi.remove(id),
    onSuccess: () => {
      invalidate()
      toast.success('Team deleted')
      navigate('/teams', { replace: true })
    },
    onError: onError('Could not delete team'),
  })

  const imageMut = useMutation({
    mutationFn: (file: File) =>
      teamsApi.setImage(id, file, !!team?.image?.public_id),
    onSuccess: () => {
      invalidate()
      toast.success('Team image updated')
    },
    onError: onError('Could not upload image'),
  })

  const removeImageMut = useMutation({
    mutationFn: () => teamsApi.removeImage(id),
    onSuccess: () => {
      invalidate()
      toast.success('Team image removed')
    },
    onError: onError('Could not remove image'),
  })

  if (isError) {
    return (
      <ErrorState
        message={extractApiError(loadError, 'Could not load this team')}
        onRetry={() => void refetch()}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <div className="flex gap-4">
            <Skeleton className="h-16 w-16 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-64" />
            </div>
          </div>
        </Card>
        <Card>
          <SkeletonList rows={4} />
        </Card>
      </div>
    )
  }

  if (!team) {
    return (
      <Card>
        <EmptyState
          title="Team not found"
          message="It may have been deleted, or you're no longer a member."
          action={
            <Link to="/teams">
              <Button variant="outline">Back to teams</Button>
            </Link>
          }
        />
      </Card>
    )
  }

  const ownerId = userId(team.ownerId)
  const isOwner = ownerId === me?._id
  const myMembership = team.members.find((m) => m.user._id === me?._id)
  const isManager = isOwner || myMembership?.role === 'admin'
  const tasks = (team.tasksId as unknown as TaskRef[]) ?? []
  const memberIds = new Set(team.members.map((m) => m.user._id))
  const candidates = (allUsers ?? []).filter((u) => !memberIds.has(u._id))

  const openEdit = () => {
    setEditName(team.name)
    setEditDescription(team.description ?? '')
    setEditError(null)
    setEditOpen(true)
  }

  return (
    <div>
      <Link
        to="/teams"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-fg"
      >
        <ArrowLeft size={15} />
        Back to teams
      </Link>

      {/* ── Team header ── */}
      <Card className="mb-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-4">
            <Avatar
              name={team.name}
              seed={team._id}
              src={team.image?.secure_url}
              size="lg"
              className="rounded-2xl"
            />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-fg">
                  {team.name}
                </h1>
                {isOwner ? (
                  <Badge tone="warning">
                    <Crown size={11} />
                    Owner
                  </Badge>
                ) : myMembership ? (
                  <Badge tone="brand" className="capitalize">
                    {myMembership.role}
                  </Badge>
                ) : null}
              </div>
              <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
                {team.description || 'No description yet.'}
              </p>
              <p className="mt-1.5 text-xs text-subtle">
                Owned by {isOwner ? 'you' : displayUser(team.ownerId)} ·{' '}
                {team.members.length}{' '}
                {team.members.length === 1 ? 'member' : 'members'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {team.chat ? (
              <Link to={`/chats?chat=${team.chat}`}>
                <Button size="sm" variant="outline">
                  <MessageSquare size={15} />
                  Team chat
                </Button>
              </Link>
            ) : null}

            {isManager ? (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                <UserPlus size={15} />
                Add member
              </Button>
            ) : null}

            <Dropdown
              trigger={
                <span className="grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-surface-3 hover:text-fg">
                  <MoreHorizontal size={18} />
                </span>
              }
            >
              {(close) => (
                <>
                  {isManager ? (
                    <DropdownItem
                      icon={<Pencil size={15} />}
                      onClick={() => {
                        close()
                        openEdit()
                      }}
                    >
                      Edit details
                    </DropdownItem>
                  ) : null}
                  {!isOwner ? (
                    <DropdownItem
                      icon={<LogOut size={15} />}
                      onClick={() => {
                        close()
                        setConfirm({ kind: 'leave' })
                      }}
                    >
                      Leave team
                    </DropdownItem>
                  ) : null}
                  {isOwner ? (
                    <>
                      <DropdownSeparator />
                      <DropdownItem
                        icon={<Trash2 size={15} />}
                        danger
                        onClick={() => {
                          close()
                          setConfirm({ kind: 'delete' })
                        }}
                      >
                        Delete team
                      </DropdownItem>
                    </>
                  ) : null}
                </>
              )}
            </Dropdown>
          </div>
        </div>

        {isManager ? (
          <div className="mt-5 border-t border-border pt-5">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-subtle">
              Team image
            </p>
            <ImagePicker
              name={team.name}
              seed={team._id}
              src={team.image?.secure_url}
              size="lg"
              rounded="xl"
              uploading={imageMut.isPending}
              removing={removeImageMut.isPending}
              onSelect={(file) => imageMut.mutate(file)}
              onRemove={() => removeImageMut.mutate()}
            />
          </div>
        ) : null}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* ── Members ── */}
        <Card>
          <CardHeader className="mb-4">
            <CardTitle>Members ({team.members.length})</CardTitle>
          </CardHeader>

          <ul className="divide-y divide-border">
            {team.members.map((m) => {
              const isTeamOwner = m.user._id === ownerId
              const isMe = m.user._id === me?._id
              return (
                <li key={m.user._id} className="flex items-center gap-3 py-3">
                  <Avatar
                    name={m.user.name}
                    seed={m.user._id}
                    src={m.user.image?.secure_url}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">
                      {m.user.name}
                      {isMe ? (
                        <span className="ml-1.5 text-xs font-normal text-subtle">
                          (you)
                        </span>
                      ) : null}
                    </p>
                    <p className="truncate text-xs text-muted">{m.user.email}</p>
                  </div>

                  {isTeamOwner ? (
                    <Badge tone="warning">
                      <Crown size={11} />
                      Owner
                    </Badge>
                  ) : isOwner ? (
                    <Select
                      aria-label={`Role for ${m.user.name}`}
                      value={m.role}
                      onChange={(e) =>
                        roleMut.mutate({
                          userId: m.user._id,
                          role: e.target.value as TeamMemberRole,
                        })
                      }
                      className="h-8 w-auto min-w-24 text-xs"
                    >
                      <option value="member">Member</option>
                      <option value="admin">Admin</option>
                    </Select>
                  ) : (
                    <Badge tone="neutral" className="capitalize">
                      {m.role}
                    </Badge>
                  )}

                  {!isTeamOwner && (isManager || isMe) ? (
                    <Dropdown
                      trigger={
                        <span className="grid h-8 w-8 place-items-center rounded-lg text-subtle transition hover:bg-surface-3 hover:text-fg">
                          <MoreHorizontal size={15} />
                        </span>
                      }
                    >
                      {(close) => (
                        <>
                          {isOwner ? (
                            <DropdownItem
                              icon={<Shield size={15} />}
                              onClick={() => {
                                close()
                                setConfirm({
                                  kind: 'transfer',
                                  userId: m.user._id,
                                  name: m.user.name,
                                })
                              }}
                            >
                              Make owner
                            </DropdownItem>
                          ) : null}
                          {isManager ? (
                            <DropdownItem
                              icon={<UserMinus size={15} />}
                              danger
                              onClick={() => {
                                close()
                                setConfirm({
                                  kind: 'remove',
                                  userId: m.user._id,
                                  name: m.user.name,
                                })
                              }}
                            >
                              Remove from team
                            </DropdownItem>
                          ) : null}
                        </>
                      )}
                    </Dropdown>
                  ) : null}
                </li>
              )
            })}
          </ul>
        </Card>

        {/* ── Tasks ── */}
        <Card>
          <CardHeader className="mb-4">
            <CardTitle>Tasks ({tasks.length})</CardTitle>
            <Link
              to={`/tasks?team=${team._id}`}
              className="text-sm font-semibold text-brand hover:underline"
            >
              Open board
            </Link>
          </CardHeader>

          {tasks.length === 0 ? (
            <EmptyState
              compact
              icon={<ListChecks size={22} />}
              title="No tasks yet"
              message="Tasks created for this team will appear here."
              action={
                <Link to={`/tasks?team=${team._id}`}>
                  <Button size="sm" variant="outline">
                    <Plus size={15} />
                    Create a task
                  </Button>
                </Link>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {tasks.map((t) => (
                <li key={t._id}>
                  <Link
                    to={`/tasks/${t._id}`}
                    className="-mx-2 flex items-center justify-between gap-3 rounded-xl px-2 py-3 transition hover:bg-surface-2"
                  >
                    <span className="min-w-0 flex-1 truncate text-sm font-medium text-fg">
                      {t.title}
                    </span>
                    {t.status ? <StatusBadge status={t.status} /> : null}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      {/* ── Add member ── */}
      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a member"
        description={
          isAdmin
            ? 'Pick someone to add to this team.'
            : 'Ask the person for their user ID, then paste it below.'
        }
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setAddOpen(false)}
              disabled={addMut.isPending}
            >
              Cancel
            </Button>
            <Button
              form="add-member-form"
              type="submit"
              loading={addMut.isPending}
              disabled={!newUserId.trim()}
            >
              <UserPlus size={15} />
              Add member
            </Button>
          </>
        }
      >
        <form
          id="add-member-form"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            setAddError(null)
            if (newUserId.trim()) addMut.mutate()
          }}
        >
          {isAdmin ? (
            <Select
              label="User"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              hint={
                candidates.length === 0
                  ? 'Everyone is already in this team.'
                  : undefined
              }
            >
              <option value="">Select a user…</option>
              {candidates.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name} — {u.email}
                </option>
              ))}
            </Select>
          ) : (
            <Input
              label="User ID"
              value={newUserId}
              onChange={(e) => setNewUserId(e.target.value)}
              placeholder="e.g. 665f1c2a9b4e1d0012ab34cd"
              hint="A 24-character MongoDB ObjectId. Members can find theirs on the Profile page."
              autoFocus
            />
          )}

          <Select
            label="Role"
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as TeamMemberRole)}
            hint="Admins can add or remove members."
          >
            <option value="member">Member</option>
            <option value="admin">Admin</option>
          </Select>

          {addError ? <ErrorState message={addError} /> : null}
        </form>
      </Modal>

      {/* ── Edit team ── */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title="Edit team"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setEditOpen(false)}
              disabled={updateMut.isPending}
            >
              Cancel
            </Button>
            <Button
              form="edit-team-form"
              type="submit"
              loading={updateMut.isPending}
              disabled={editName.trim().length < 2}
            >
              Save changes
            </Button>
          </>
        }
      >
        <form
          id="edit-team-form"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            setEditError(null)
            updateMut.mutate()
          }}
        >
          <Input
            label="Team name"
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            required
            autoFocus
          />
          <Textarea
            label="Description"
            value={editDescription}
            onChange={(e) => setEditDescription(e.target.value)}
          />
          {editError ? <ErrorState message={editError} /> : null}
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        loading={
          deleteMut.isPending ||
          leaveMut.isPending ||
          removeMut.isPending ||
          transferMut.isPending
        }
        destructive={confirm?.kind !== 'transfer'}
        title={
          confirm?.kind === 'delete'
            ? 'Delete this team?'
            : confirm?.kind === 'leave'
              ? 'Leave this team?'
              : confirm?.kind === 'transfer'
                ? 'Transfer ownership?'
                : 'Remove member?'
        }
        message={
          confirm?.kind === 'delete'
            ? `"${team.name}", its tasks and its chat will be permanently deleted.`
            : confirm?.kind === 'leave'
              ? `You'll lose access to ${team.name}'s tasks and chat.`
              : confirm?.kind === 'transfer'
                ? `${confirm.name} will become the owner and you'll become an admin.`
                : confirm?.kind === 'remove'
                  ? `${confirm.name} will lose access to this team.`
                  : ''
        }
        confirmLabel={
          confirm?.kind === 'delete'
            ? 'Delete team'
            : confirm?.kind === 'leave'
              ? 'Leave team'
              : confirm?.kind === 'transfer'
                ? 'Transfer'
                : 'Remove'
        }
        onConfirm={() => {
          if (!confirm) return
          if (confirm.kind === 'delete') deleteMut.mutate()
          else if (confirm.kind === 'leave') leaveMut.mutate()
          else if (confirm.kind === 'remove') removeMut.mutate(confirm.userId)
          else transferMut.mutate(confirm.userId)
        }}
      />
    </div>
  )
}
