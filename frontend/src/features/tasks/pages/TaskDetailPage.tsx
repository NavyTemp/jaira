import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  Trash2,
  User as UserIcon,
  UsersRound,
} from 'lucide-react'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, PriorityBadge, StatusBadge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/Dropdown'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { extractApiError } from '@/lib/apiClient'
import { authStorage } from '@/lib/authStorage'
import { displayUser, dueLabel, dueState, formatDateTime, userId } from '@/lib/format'
import { teamsApi } from '@/features/teams/api/teamsApi'
import { tasksApi } from '../api/tasksApi'
import { ALLOWED_TRANSITIONS, STATUS_LABEL } from '../constants'
import { TaskAttachments } from '../components/TaskAttachments'
import { TaskComments } from '../components/TaskComments'
import { TaskFormModal } from '../components/TaskFormModal'
import type { TaskStatus } from '../types'

function DetailField({
  label,
  icon,
  children,
}: {
  label: string
  icon: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div>
      <dt className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-subtle">
        {icon}
        {label}
      </dt>
      <dd className="text-sm text-fg">{children}</dd>
    </div>
  )
}

export function TaskDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const toast = useToast()
  const me = authStorage.getUser()

  const [editOpen, setEditOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const {
    data: task,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.getOne(id),
    enabled: !!id,
  })

  const teamId =
    task && typeof task.team === 'object' && task.team ? task.team._id : undefined

  const { data: team } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamsApi.getOne(teamId as string),
    enabled: !!teamId,
  })

  const statusMut = useMutation({
    mutationFn: (status: TaskStatus) => tasksApi.changeStatus(id, status),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['task', id] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`Moved to ${STATUS_LABEL[updated.status]}`)
    },
    onError: (err) => toast.error(extractApiError(err, 'Could not change status')),
  })

  const assignMut = useMutation({
    mutationFn: (assignedTo: string[]) => tasksApi.assign(id, assignedTo),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['task', id] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
    onError: (err) => toast.error(extractApiError(err, 'Could not update assignees')),
  })

  const deleteMut = useMutation({
    mutationFn: () => tasksApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success('Task deleted')
      navigate('/tasks', { replace: true })
    },
    onError: (err) => toast.error(extractApiError(err, 'Could not delete task')),
  })

  if (isError) {
    return (
      <ErrorState
        message={extractApiError(error, 'Could not load this task')}
        onRetry={() => void refetch()}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-24" />
        <Card>
          <Skeleton className="mb-4 h-7 w-2/3" />
          <SkeletonText lines={3} />
        </Card>
        <Card>
          <SkeletonText lines={4} />
        </Card>
      </div>
    )
  }

  if (!task) {
    return (
      <Card>
        <EmptyState
          title="Task not found"
          message="It may have been deleted, or you no longer have access."
          action={
            <Link to="/tasks">
              <Button variant="outline">Back to tasks</Button>
            </Link>
          }
        />
      </Card>
    )
  }

  const assignedIds = task.assignedTo.map((u) => userId(u))
  const nextStatuses = ALLOWED_TRANSITIONS[task.status]
  const state = dueState(task.dueDate)

  const toggleAssignee = (uid: string) => {
    const next = assignedIds.includes(uid)
      ? assignedIds.filter((x) => x !== uid)
      : [...assignedIds, uid]
    assignMut.mutate(next)
  }

  return (
    <div>
      <Link
        to="/tasks"
        className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-fg"
      >
        <ArrowLeft size={15} />
        Back to tasks
      </Link>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* ── Overview ── */}
          <Card>
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <h1 className="text-xl font-bold leading-tight tracking-tight text-fg sm:text-2xl">
                  {task.title}
                </h1>
                <div className="mt-2.5 flex flex-wrap items-center gap-2">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  {task.tags.map((tag) => (
                    <Badge key={tag} tone="outline">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              <Dropdown
                trigger={
                  <span className="grid h-9 w-9 place-items-center rounded-xl text-muted transition hover:bg-surface-3 hover:text-fg">
                    <MoreHorizontal size={18} />
                  </span>
                }
              >
                {(close) => (
                  <>
                    <DropdownItem
                      icon={<Pencil size={15} />}
                      onClick={() => {
                        close()
                        setEditOpen(true)
                      }}
                    >
                      Edit task
                    </DropdownItem>
                    {task.chat ? (
                      <DropdownItem
                        icon={<MessageSquare size={15} />}
                        onClick={() => {
                          close()
                          navigate(`/chats?chat=${task.chat}`)
                        }}
                      >
                        Open task chat
                      </DropdownItem>
                    ) : null}
                    <DropdownSeparator />
                    <DropdownItem
                      icon={<Trash2 size={15} />}
                      danger
                      onClick={() => {
                        close()
                        setConfirmDelete(true)
                      }}
                    >
                      Delete task
                    </DropdownItem>
                  </>
                )}
              </Dropdown>
            </div>

            <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted">
              {task.description || 'No description provided.'}
            </p>

            <dl className="mt-6 grid grid-cols-2 gap-5 border-t border-border pt-5 sm:grid-cols-4">
              <DetailField label="Team" icon={<UsersRound size={12} />}>
                {typeof task.team === 'object' && task.team ? (
                  <Link
                    to={`/teams/${task.team._id}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {task.team.name}
                  </Link>
                ) : (
                  'Personal'
                )}
              </DetailField>

              <DetailField label="Due" icon={<CalendarClock size={12} />}>
                <span
                  className={cn(
                    state === 'overdue' && 'font-semibold text-danger',
                    state === 'today' && 'font-semibold text-warning',
                  )}
                >
                  {dueLabel(task.dueDate)}
                </span>
              </DetailField>

              <DetailField label="Created by" icon={<UserIcon size={12} />}>
                <span className="inline-flex items-center gap-1.5">
                  <Avatar
                    name={displayUser(task.createdBy)}
                    seed={userId(task.createdBy)}
                    src={
                      typeof task.createdBy === 'object'
                        ? task.createdBy.image?.secure_url
                        : undefined
                    }
                    size="xs"
                  />
                  {displayUser(task.createdBy)}
                </span>
              </DetailField>

              <DetailField label="Created" icon={<CalendarClock size={12} />}>
                {formatDateTime(task.createdAt)}
              </DetailField>
            </dl>
          </Card>

          <Card>
            <TaskComments taskId={task._id} comments={task.comments} />
          </Card>
        </div>

        {/* ── Side rail ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="mb-4">
              <CardTitle>Move task</CardTitle>
            </CardHeader>

            {nextStatuses.length === 0 ? (
              <p className="flex items-center gap-2 rounded-xl bg-success-soft px-3 py-2.5 text-sm font-medium text-success-soft-fg">
                <Check size={15} />
                This task is complete.
              </p>
            ) : (
              <div className="space-y-2">
                {nextStatuses.map((s) => (
                  <Button
                    key={s}
                    variant="outline"
                    fullWidth
                    className="justify-between"
                    loading={statusMut.isPending}
                    onClick={() => statusMut.mutate(s)}
                  >
                    <span>Move to {STATUS_LABEL[s]}</span>
                    <ArrowRight size={15} />
                  </Button>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader className="mb-4">
              <CardTitle>Assignees</CardTitle>
              {assignMut.isPending ? (
                <span className="text-xs text-muted">Saving…</span>
              ) : null}
            </CardHeader>

            {!team ? (
              task.assignedTo.length === 0 ? (
                <p className="text-sm text-muted">
                  Personal tasks can't have assignees.
                </p>
              ) : (
                <ul className="space-y-2">
                  {task.assignedTo.map((u) => (
                    <li
                      key={userId(u)}
                      className="flex items-center gap-2.5 text-sm text-fg"
                    >
                      <Avatar
                        name={displayUser(u)}
                        seed={userId(u)}
                        src={typeof u === 'object' ? u.image?.secure_url : undefined}
                        size="sm"
                      />
                      {displayUser(u)}
                    </li>
                  ))}
                </ul>
              )
            ) : (
              <div className="space-y-1">
                {team.members.map((m) => {
                  const active = assignedIds.includes(m.user._id)
                  return (
                    <button
                      key={m.user._id}
                      onClick={() => toggleAssignee(m.user._id)}
                      disabled={assignMut.isPending}
                      className={cn(
                        'flex w-full items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition',
                        active
                          ? 'border-brand bg-brand-soft'
                          : 'border-transparent hover:bg-surface-2',
                      )}
                    >
                      <Avatar
                        name={m.user.name}
                        seed={m.user._id}
                        src={m.user.image?.secure_url}
                        size="sm"
                      />
                      <span className="min-w-0 flex-1">
                        <span
                          className={cn(
                            'block truncate text-sm font-medium',
                            active ? 'text-brand-soft-fg' : 'text-fg',
                          )}
                        >
                          {m.user._id === me?._id ? 'You' : m.user.name}
                        </span>
                        <span className="block text-xs capitalize text-muted">
                          {m.role}
                        </span>
                      </span>
                      {active ? (
                        <Check size={15} className="shrink-0 text-brand" />
                      ) : null}
                    </button>
                  )
                })}
              </div>
            )}
          </Card>

          <Card>
            <TaskAttachments taskId={task._id} attachments={task.attachments} />
          </Card>
        </div>
      </div>

      <TaskFormModal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        task={task}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => deleteMut.mutate()}
        loading={deleteMut.isPending}
        title="Delete this task?"
        message={`"${task.title}" and its comments will be permanently deleted.`}
        confirmLabel="Delete task"
      />
    </div>
  )
}
