import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDashed,
  ListChecks,
  Loader,
  Plus,
  TriangleAlert,
  UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Card, CardHeader, CardTitle, PageHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge, PriorityBadge, StatusBadge } from '@/components/ui/Badge'
import { Avatar, AvatarGroup } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { Skeleton, SkeletonCards, SkeletonList } from '@/components/ui/Skeleton'
import { Progress } from '@/components/ui/Progress'
import { authStorage } from '@/lib/authStorage'
import { cn } from '@/lib/cn'
import { dueState, formatDate, populatedUsers, relativeTime } from '@/lib/format'
import { tasksApi } from '@/features/tasks/api/tasksApi'
import { teamsApi } from '@/features/teams/api/teamsApi'
import { notificationsApi } from '@/features/notifications/api/notificationsApi'
import type { Task } from '@/features/tasks/types'

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 18) return 'Good afternoon'
  return 'Good evening'
}

function StatCard({
  label,
  value,
  Icon,
  tone,
  to,
}: {
  label: string
  value: number
  Icon: LucideIcon
  tone: 'brand' | 'info' | 'warning' | 'success'
  to: string
}) {
  const toneClass = {
    brand: 'bg-brand-soft text-brand-soft-fg',
    info: 'bg-info-soft text-info-soft-fg',
    warning: 'bg-warning-soft text-warning-soft-fg',
    success: 'bg-success-soft text-success-soft-fg',
  }[tone]

  return (
    <Link to={to} className="group">
      <Card className="transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md">
        <div className="flex items-start justify-between">
          <span className={cn('grid h-10 w-10 place-items-center rounded-xl', toneClass)}>
            <Icon size={19} />
          </span>
          <ArrowRight
            size={16}
            className="text-subtle opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100"
          />
        </div>
        <p className="mt-4 text-3xl font-bold tracking-tight text-fg">{value}</p>
        <p className="mt-0.5 text-sm text-muted">{label}</p>
      </Card>
    </Link>
  )
}

function TaskRow({ task }: { task: Task }) {
  const state = dueState(task.dueDate)
  return (
    <Link
      to={`/tasks/${task._id}`}
      className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-surface-2"
    >
      <span
        className={cn(
          'grid h-8 w-8 shrink-0 place-items-center rounded-lg',
          state === 'overdue'
            ? 'bg-danger-soft text-danger-soft-fg'
            : state === 'today'
              ? 'bg-warning-soft text-warning-soft-fg'
              : 'bg-surface-3 text-subtle',
        )}
      >
        {state === 'overdue' ? (
          <TriangleAlert size={15} />
        ) : (
          <CalendarClock size={15} />
        )}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-fg">
          {task.title}
        </span>
        <span className="mt-0.5 block text-xs text-muted">
          {typeof task.team === 'object' && task.team
            ? task.team.name
            : 'Personal'}
          {task.dueDate ? ` · ${formatDate(task.dueDate)}` : ''}
        </span>
      </span>

      <span className="hidden shrink-0 sm:block">
        <PriorityBadge priority={task.priority} />
      </span>
      <AvatarGroup users={populatedUsers(task.assignedTo)} max={3} size="xs" />
    </Link>
  )
}

export function DashboardPage() {
  const me = authStorage.getUser()

  const { data: taskData, isLoading: tasksLoading } = useQuery({
    queryKey: ['tasks', 'dashboard'],
    queryFn: () => tasksApi.listAll(),
  })

  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.listMine(),
  })

  const { data: notifications } = useQuery({
    queryKey: ['notifications', 'dashboard'],
    queryFn: () => notificationsApi.list({ limit: 5 }),
  })

  const tasks = taskData?.tasks ?? []

  const byStatus = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    review: tasks.filter((t) => t.status === 'review'),
    done: tasks.filter((t) => t.status === 'done'),
  }

  const open = tasks.filter((t) => t.status !== 'done')
  const overdue = open.filter((t) => dueState(t.dueDate) === 'overdue')
  const dueToday = open.filter((t) => dueState(t.dueDate) === 'today')
  const focus = [...overdue, ...dueToday].slice(0, 6)

  const completion = tasks.length
    ? Math.round((byStatus.done.length / tasks.length) * 100)
    : 0

  const recent = [...tasks]
    .sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    )
    .slice(0, 6)

  return (
    <div>
      <PageHeader
        title={`${greeting()}, ${me?.name?.split(' ')[0] ?? 'there'}`}
        description="Here's what's happening across your workspace today."
        actions={
          <Link to="/tasks">
            <Button size="sm">
              <Plus size={16} />
              New task
            </Button>
          </Link>
        }
      />

      {tasksLoading ? (
        <SkeletonCards count={4} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Open tasks"
            value={open.length}
            Icon={ListChecks}
            tone="brand"
            to="/tasks"
          />
          <StatCard
            label="In progress"
            value={byStatus.in_progress.length}
            Icon={Loader}
            tone="info"
            to="/tasks?status=in_progress"
          />
          <StatCard
            label="Overdue"
            value={overdue.length}
            Icon={TriangleAlert}
            tone="warning"
            to="/tasks"
          />
          <StatCard
            label="Completed"
            value={byStatus.done.length}
            Icon={CheckCircle2}
            tone="success"
            to="/tasks?status=done"
          />
        </div>
      )}

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {/* ── Focus + progress ── */}
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader className="mb-4">
              <div>
                <CardTitle>Needs your attention</CardTitle>
                <p className="mt-0.5 text-sm text-muted">
                  Overdue and due-today tasks, most urgent first.
                </p>
              </div>
              {focus.length > 0 ? (
                <Badge tone={overdue.length ? 'danger' : 'warning'}>
                  {focus.length} to review
                </Badge>
              ) : null}
            </CardHeader>

            {tasksLoading ? (
              <SkeletonList rows={3} />
            ) : focus.length === 0 ? (
              <EmptyState
                compact
                icon={<CheckCircle2 size={22} />}
                title="Nothing overdue"
                message="Every task with a deadline is on track. Nice work."
              />
            ) : (
              <div className="divide-y divide-border">
                {focus.map((t) => (
                  <TaskRow key={t._id} task={t} />
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader className="mb-4">
              <CardTitle>Workload breakdown</CardTitle>
              <span className="text-sm font-semibold text-fg">
                {completion}% complete
              </span>
            </CardHeader>

            {tasksLoading ? (
              <Skeleton className="h-2 w-full" />
            ) : (
              <>
                <Progress value={completion} label="Overall completion" />
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {(
                    [
                      ['todo', 'To do', CircleDashed],
                      ['in_progress', 'In progress', Loader],
                      ['review', 'In review', CalendarClock],
                      ['done', 'Done', CheckCircle2],
                    ] as const
                  ).map(([key, label, Icon]) => (
                    <Link
                      key={key}
                      to={`/tasks?status=${key}`}
                      className="rounded-xl border border-border bg-surface-2 p-3 transition hover:border-border-strong hover:bg-surface-3"
                    >
                      <span className="flex items-center gap-1.5 text-xs font-medium text-muted">
                        <Icon size={13} />
                        {label}
                      </span>
                      <p className="mt-1 text-xl font-bold text-fg">
                        {byStatus[key].length}
                      </p>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </Card>

          <Card>
            <CardHeader className="mb-4">
              <CardTitle>Recent activity</CardTitle>
              <Link
                to="/tasks"
                className="text-sm font-semibold text-brand hover:underline"
              >
                View all
              </Link>
            </CardHeader>

            {tasksLoading ? (
              <SkeletonList rows={4} />
            ) : recent.length === 0 ? (
              <EmptyState
                compact
                icon={<ListChecks size={22} />}
                title="No tasks yet"
                message="Create your first task to get the workspace moving."
                action={
                  <Link to="/tasks">
                    <Button size="sm">
                      <Plus size={15} />
                      Create task
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="divide-y divide-border">
                {recent.map((t) => (
                  <Link
                    key={t._id}
                    to={`/tasks/${t._id}`}
                    className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2.5 transition hover:bg-surface-2"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg">
                        {t.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-muted">
                        Updated {relativeTime(t.updatedAt)}
                      </span>
                    </span>
                    <StatusBadge status={t.status} />
                  </Link>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ── Side rail ── */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="mb-4">
              <CardTitle>My teams</CardTitle>
              <Link
                to="/teams"
                className="text-sm font-semibold text-brand hover:underline"
              >
                All
              </Link>
            </CardHeader>

            {teamsLoading ? (
              <SkeletonList rows={3} />
            ) : (teams ?? []).length === 0 ? (
              <EmptyState
                compact
                icon={<UsersRound size={22} />}
                title="No teams yet"
                message="Create a team to collaborate on tasks."
                action={
                  <Link to="/teams">
                    <Button size="sm" variant="outline">
                      Go to teams
                    </Button>
                  </Link>
                }
              />
            ) : (
              <div className="space-y-1">
                {(teams ?? []).slice(0, 5).map((team) => (
                  <Link
                    key={team._id}
                    to={`/teams/${team._id}`}
                    className="-mx-2 flex items-center gap-3 rounded-xl px-2 py-2 transition hover:bg-surface-2"
                  >
                    <Avatar
                      name={team.name}
                      seed={team._id}
                      src={team.image?.secure_url}
                      size="sm"
                      className="rounded-xl"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-fg">
                        {team.name}
                      </span>
                      <span className="block text-xs text-muted">
                        {team.members.length}{' '}
                        {team.members.length === 1 ? 'member' : 'members'}
                      </span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <CardHeader className="mb-4">
              <CardTitle>Latest notifications</CardTitle>
              {notifications?.unreadCount ? (
                <Badge tone="brand">{notifications.unreadCount} new</Badge>
              ) : null}
            </CardHeader>

            {(notifications?.notifications ?? []).length === 0 ? (
              <EmptyState
                compact
                icon={<CheckCircle2 size={22} />}
                title="All caught up"
                message="New activity will show up here."
              />
            ) : (
              <div className="space-y-3">
                {notifications?.notifications.map((n) => (
                  <div key={n._id} className="flex gap-2.5">
                    <span
                      className={cn(
                        'mt-1.5 h-2 w-2 shrink-0 rounded-full',
                        n.isRead ? 'bg-border-strong' : 'bg-brand',
                      )}
                    />
                    <div className="min-w-0">
                      <p
                        className={cn(
                          'text-sm leading-snug',
                          n.isRead ? 'text-muted' : 'font-medium text-fg',
                        )}
                      >
                        {n.message}
                      </p>
                      <p className="mt-0.5 text-xs text-subtle">
                        {relativeTime(n.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
                <Link
                  to="/notifications"
                  className="block pt-1 text-sm font-semibold text-brand hover:underline"
                >
                  View all
                </Link>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}
