import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  ListChecks,
  List as ListIcon,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react'
import { Card, PageHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Input'
import { Segmented } from '@/components/ui/Segmented'
import { AvatarGroup } from '@/components/ui/Avatar'
import { PriorityBadge, StatusBadge } from '@/components/ui/Badge'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { extractApiError } from '@/lib/apiClient'
import { dueLabel, dueState, populatedUsers } from '@/lib/format'
import { teamsApi } from '@/features/teams/api/teamsApi'
import { tasksApi } from '../api/tasksApi'
import { TaskBoard } from '../components/TaskBoard'
import { TaskFormModal } from '../components/TaskFormModal'
import {
  PRIORITIES,
  PRIORITY_LABEL,
  STATUSES,
  STATUS_LABEL,
} from '../constants'
import type { Task, TaskPriority, TaskStatus } from '../types'

const PAGE_SIZE = 12

type View = 'list' | 'board'

function TaskListRow({ task }: { task: Task }) {
  const state = dueState(task.dueDate)
  return (
    <Link
      to={`/tasks/${task._id}`}
      className="flex items-center gap-3 px-2 py-3.5 transition hover:bg-surface-2 sm:gap-4"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-fg">{task.title}</p>
        <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
          <span className="font-medium">
            {typeof task.team === 'object' && task.team
              ? task.team.name
              : 'Personal'}
          </span>
          <span className="text-border-strong">·</span>
          <span
            className={cn(
              state === 'overdue' && 'font-semibold text-danger',
              state === 'today' && 'font-semibold text-warning',
            )}
          >
            {dueLabel(task.dueDate)}
          </span>
          {task.tags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-surface-3 px-1.5 py-0.5 font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      <div className="hidden shrink-0 sm:block">
        <AvatarGroup users={populatedUsers(task.assignedTo)} max={3} size="xs" />
      </div>
      <div className="hidden shrink-0 md:block">
        <PriorityBadge priority={task.priority} />
      </div>
      <StatusBadge status={task.status} className="shrink-0" />
    </Link>
  )
}

export function TasksListPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const [params, setParams] = useSearchParams()

  const [view, setView] = useState<View>(
    () => (localStorage.getItem('tms_tasks_view') as View) || 'board',
  )
  const [createOpen, setCreateOpen] = useState(false)
  const [page, setPage] = useState(1)

  const search = params.get('q') ?? ''
  const status = (params.get('status') as TaskStatus | null) ?? ''
  const priority = (params.get('priority') as TaskPriority | null) ?? ''
  const team = params.get('team') ?? ''

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
    setPage(1)
  }

  const changeView = (v: View) => {
    setView(v)
    localStorage.setItem('tms_tasks_view', v)
  }

  // Server-side filters that don't conflict with the board's need for all
  // statuses; status + text search are applied client-side below.
  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tasks', 'all', { priority, team }],
    queryFn: () =>
      tasksApi.listAll({
        priority: (priority || undefined) as TaskPriority | undefined,
        team: team || undefined,
      }),
  })

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.listMine(),
  })

  const statusMut = useMutation({
    mutationFn: ({ id, status }: { id: string; status: TaskStatus }) =>
      tasksApi.changeStatus(id, status),
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      toast.success(`Moved to ${STATUS_LABEL[task.status]}`)
    },
    onError: (err) => toast.error(extractApiError(err, 'Could not move task')),
  })

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return (data?.tasks ?? []).filter((t) => {
      if (status && t.status !== status) return false
      if (!q) return true
      return (
        t.title.toLowerCase().includes(q) ||
        (t.description ?? '').toLowerCase().includes(q) ||
        t.tags.some((tag) => tag.toLowerCase().includes(q))
      )
    })
  }, [data?.tasks, search, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const currentPage = Math.min(page, totalPages)
  const paged = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  )

  const hasFilters = !!(search || status || priority || team)

  const clearFilters = () => {
    setParams(new URLSearchParams(), { replace: true })
    setPage(1)
  }

  return (
    <div>
      <PageHeader
        title="Tasks"
        description={
          data
            ? `${filtered.length} of ${data.tasks.length} task${data.tasks.length === 1 ? '' : 's'}`
            : 'Plan, assign and track your work.'
        }
        icon={<ListChecks size={19} />}
        actions={
          <>
            <Segmented
              value={view}
              onChange={changeView}
              options={[
                { value: 'board', label: 'Board', icon: <Columns3 size={14} /> },
                { value: 'list', label: 'List', icon: <ListIcon size={14} /> },
              ]}
            />
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={16} />
              New task
            </Button>
          </>
        }
      />

      {/* ── Filter bar ── */}
      <Card className="mb-4 p-3 sm:p-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-52 flex-1">
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
            />
            <input
              value={search}
              onChange={(e) => setParam('q', e.target.value)}
              placeholder="Search title, description or tags…"
              aria-label="Search tasks"
              className="h-10 w-full rounded-xl border border-border bg-surface-2 pl-9 pr-9 text-sm text-fg transition placeholder:text-subtle hover:border-border-strong focus:border-brand focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
            {search ? (
              <button
                onClick={() => setParam('q', '')}
                aria-label="Clear search"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-subtle transition hover:bg-surface-3 hover:text-fg"
              >
                <X size={14} />
              </button>
            ) : null}
          </div>

          <Select
            aria-label="Filter by status"
            value={status}
            onChange={(e) => setParam('status', e.target.value)}
            className="h-10 w-auto min-w-36"
          >
            <option value="">All statuses</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {STATUS_LABEL[s]}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by priority"
            value={priority}
            onChange={(e) => setParam('priority', e.target.value)}
            className="h-10 w-auto min-w-36"
          >
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </Select>

          <Select
            aria-label="Filter by team"
            value={team}
            onChange={(e) => setParam('team', e.target.value)}
            className="h-10 w-auto min-w-36"
          >
            <option value="">All teams</option>
            {(teams ?? []).map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </Select>

          {hasFilters ? (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <SlidersHorizontal size={15} />
              Clear
            </Button>
          ) : null}
        </div>
      </Card>

      {isError ? (
        <ErrorState
          message={extractApiError(error, 'Could not load tasks')}
          onRetry={() => void refetch()}
        />
      ) : isLoading ? (
        <Card>
          <SkeletonList rows={6} />
        </Card>
      ) : filtered.length === 0 ? (
        <Card>
          <EmptyState
            icon={<ListChecks size={24} />}
            title={hasFilters ? 'No matching tasks' : 'No tasks yet'}
            message={
              hasFilters
                ? 'Try relaxing your filters or clearing the search.'
                : 'Create your first task and it will show up on the board.'
            }
            action={
              hasFilters ? (
                <Button variant="outline" onClick={clearFilters}>
                  Clear filters
                </Button>
              ) : (
                <Button onClick={() => setCreateOpen(true)}>
                  <Plus size={16} />
                  Create task
                </Button>
              )
            }
          />
        </Card>
      ) : view === 'board' ? (
        <TaskBoard
          tasks={filtered}
          onCreate={() => setCreateOpen(true)}
          onStatusChange={(id, next) => statusMut.mutate({ id, status: next })}
        />
      ) : (
        <Card padded={false}>
          <div className="divide-y divide-border px-3 sm:px-4">
            {paged.map((task) => (
              <TaskListRow key={task._id} task={task} />
            ))}
          </div>

          {totalPages > 1 ? (
            <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3">
              <p className="text-xs text-muted">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage <= 1}
                  onClick={() => setPage(currentPage - 1)}
                >
                  <ChevronLeft size={15} />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={currentPage >= totalPages}
                  onClick={() => setPage(currentPage + 1)}
                >
                  Next
                  <ChevronRight size={15} />
                </Button>
              </div>
            </div>
          ) : null}
        </Card>
      )}

      <TaskFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        defaultTeam={team || undefined}
      />
    </div>
  )
}
