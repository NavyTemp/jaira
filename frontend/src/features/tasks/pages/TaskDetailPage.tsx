import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { extractApiError } from '@/lib/apiClient'
import { displayUser, formatDate, formatDateTime, userId } from '@/lib/format'
import { authStorage } from '@/lib/authStorage'
import { tasksApi } from '../api/tasksApi'
import { teamsApi } from '@/features/teams/api/teamsApi'
import { commentsApi } from '@/features/comments/api/commentsApi'
import type { TaskStatus } from '../types'

const NEXT_STATUS: Record<TaskStatus, TaskStatus[]> = {
  todo: ['in_progress'],
  in_progress: ['review', 'todo'],
  review: ['done', 'in_progress'],
  done: [],
}

export function TaskDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const me = authStorage.getUser()

  const [comment, setComment] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: task, isLoading } = useQuery({
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', id] }),
    onError: (err) => setError(extractApiError(err)),
  })

  const assignMut = useMutation({
    mutationFn: (assignedTo: string[]) => tasksApi.assign(id, assignedTo),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', id] }),
    onError: (err) => setError(extractApiError(err)),
  })

  const addCommentMut = useMutation({
    mutationFn: () => commentsApi.add(id, comment),
    onSuccess: () => {
      setComment('')
      qc.invalidateQueries({ queryKey: ['task', id] })
    },
    onError: (err) => setError(extractApiError(err)),
  })

  const delCommentMut = useMutation({
    mutationFn: (commentId: string) => commentsApi.remove(id, commentId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['task', id] }),
    onError: (err) => setError(extractApiError(err)),
  })

  const delTaskMut = useMutation({
    mutationFn: () => tasksApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      navigate('/tasks', { replace: true })
    },
    onError: (err) => setError(extractApiError(err)),
  })

  if (isLoading) return <Card><p className="text-sm text-slate-500">Loading…</p></Card>
  if (!task) return <Card><p className="text-sm text-slate-500">Task not found.</p></Card>

  const assignedIds = task.assignedTo.map((u) => userId(u))

  const toggleAssignee = (uid: string) => {
    const next = assignedIds.includes(uid)
      ? assignedIds.filter((x) => x !== uid)
      : [...assignedIds, uid]
    assignMut.mutate(next)
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{task.title}</CardTitle>
          <div className="flex items-center gap-2">
            <PriorityBadge priority={task.priority} />
            <StatusBadge status={task.status} />
          </div>
        </CardHeader>

        <p className="whitespace-pre-wrap text-sm text-slate-700">
          {task.description || 'No description.'}
        </p>

        <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm md:grid-cols-4">
          <div>
            <dt className="text-slate-500">Team</dt>
            <dd className="text-slate-900">
              {typeof task.team === 'object' && task.team ? task.team.name : 'Personal'}
            </dd>
          </div>
          <div>
            <dt className="text-slate-500">Due</dt>
            <dd className="text-slate-900">{formatDate(task.dueDate)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Created by</dt>
            <dd className="text-slate-900">{displayUser(task.createdBy)}</dd>
          </div>
          <div>
            <dt className="text-slate-500">Assignees</dt>
            <dd className="text-slate-900">
              {task.assignedTo.length
                ? task.assignedTo.map((u) => displayUser(u)).join(', ')
                : '—'}
            </dd>
          </div>
        </dl>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="text-sm text-slate-500">Move to:</span>
          {NEXT_STATUS[task.status].length === 0 ? (
            <span className="text-sm text-slate-400">no further transitions</span>
          ) : (
            NEXT_STATUS[task.status].map((s) => (
              <Button
                key={s}
                size="sm"
                variant="secondary"
                loading={statusMut.isPending}
                onClick={() => statusMut.mutate(s)}
              >
                {s}
              </Button>
            ))
          )}
          <div className="flex-1" />
          {task.chat ? (
            <Link to={`/chats?chat=${task.chat}`}>
              <Button size="sm" variant="ghost">
                Open task chat
              </Button>
            </Link>
          ) : null}
          <Button
            size="sm"
            variant="danger"
            onClick={() => delTaskMut.mutate()}
            loading={delTaskMut.isPending}
          >
            Delete
          </Button>
        </div>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
      </Card>

      {team ? (
        <Card>
          <CardHeader>
            <CardTitle>Assign team members</CardTitle>
          </CardHeader>
          <div className="flex flex-wrap gap-2">
            {team.members.map((m) => {
              const uid = m.user._id
              const active = assignedIds.includes(uid)
              return (
                <button
                  key={uid}
                  onClick={() => toggleAssignee(uid)}
                  disabled={assignMut.isPending}
                  className={
                    'rounded-full border px-3 py-1 text-sm transition ' +
                    (active
                      ? 'border-slate-900 bg-slate-900 text-white'
                      : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50')
                  }
                >
                  {m.user.name}
                </button>
              )
            })}
          </div>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Comments ({task.comments.length})</CardTitle>
        </CardHeader>

        <form
          className="mb-4 flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            if (comment.trim()) addCommentMut.mutate()
          }}
        >
          <input
            className="h-10 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm"
            placeholder="Write a comment…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <Button type="submit" loading={addCommentMut.isPending}>
            Send
          </Button>
        </form>

        {task.comments.length === 0 ? (
          <p className="text-sm text-slate-500">No comments yet.</p>
        ) : (
          <ul className="space-y-3">
            {task.comments.map((c) => (
              <li key={c._id} className="rounded-md bg-slate-50 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-900">
                    {displayUser(c.user)}
                  </span>
                  <span className="text-xs text-slate-400">
                    {formatDateTime(c.createdAt)}
                  </span>
                </div>
                <p className="mt-1 text-sm text-slate-700">{c.text}</p>
                {userId(c.user) === me?._id ? (
                  <button
                    onClick={() => delCommentMut.mutate(c._id)}
                    className="mt-1 text-xs text-red-500 hover:underline"
                  >
                    delete
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
