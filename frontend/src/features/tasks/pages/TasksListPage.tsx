import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { StatusBadge, PriorityBadge } from '@/components/ui/Badge'
import { extractApiError } from '@/lib/apiClient'
import { displayUser, formatDate } from '@/lib/format'
import { tasksApi } from '../api/tasksApi'
import { teamsApi } from '@/features/teams/api/teamsApi'
import type { TaskPriority, TaskStatus } from '../types'

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

export function TasksListPage() {
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<TaskPriority>('medium')
  const [dueDate, setDueDate] = useState('')
  const [team, setTeam] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['tasks', { status: statusFilter }],
    queryFn: () =>
      tasksApi.list(statusFilter ? { status: statusFilter } : undefined),
  })

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.listMine(),
  })

  const createMut = useMutation({
    mutationFn: () =>
      tasksApi.create({
        title,
        description: description || undefined,
        priority,
        dueDate: dueDate || undefined,
        team: team || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      setOpen(false)
      setTitle('')
      setDescription('')
      setPriority('medium')
      setDueDate('')
      setTeam('')
    },
    onError: (err) => setError(extractApiError(err, 'Could not create task')),
  })

  const tasks = data?.tasks ?? []

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
          <div className="flex items-center gap-2">
            <select
              className="h-9 rounded-md border border-slate-300 bg-white px-2 text-sm"
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as TaskStatus | '')
              }
            >
              <option value="">All statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <Button size="sm" onClick={() => setOpen(true)}>
              New task
            </Button>
          </div>
        </CardHeader>

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : tasks.length === 0 ? (
          <p className="text-sm text-slate-500">
            No tasks yet. Create your first one.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.map((t) => (
              <li key={t._id}>
                <Link
                  to={`/tasks/${t._id}`}
                  className="flex items-center justify-between gap-4 py-3 hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-slate-900">
                      {t.title}
                    </p>
                    <p className="text-xs text-slate-500">
                      {typeof t.team === 'object' && t.team
                        ? t.team.name
                        : 'Personal'}{' '}
                      · due {formatDate(t.dueDate)} · by{' '}
                      {displayUser(t.createdBy)}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <PriorityBadge priority={t.priority} />
                    <StatusBadge status={t.status} />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create task"
      >
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            createMut.mutate()
          }}
        >
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Description</span>
            <textarea
              className="min-h-20 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-medium text-slate-700">Priority</span>
              <select
                className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
              >
                {PRIORITIES.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </label>
            <Input
              label="Due date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Team (optional)</span>
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm"
              value={team}
              onChange={(e) => setTeam(e.target.value)}
            >
              <option value="">Personal task</option>
              {(teams ?? []).map((tm) => (
                <option key={tm._id} value={tm._id}>
                  {tm.name}
                </option>
              ))}
            </select>
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={createMut.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
