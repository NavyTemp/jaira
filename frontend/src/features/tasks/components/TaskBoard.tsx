import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, MessageSquare, Paperclip, Plus } from 'lucide-react'
import { AvatarGroup } from '@/components/ui/Avatar'
import { PriorityBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/cn'
import { dueState, formatDate, populatedUsers } from '@/lib/format'
import { STATUSES, STATUS_DOT, STATUS_LABEL, canMove } from '../constants'
import type { Task, TaskStatus } from '../types'

function TaskCard({
  task,
  onDragStart,
  onDragEnd,
  dragging,
}: {
  task: Task
  onDragStart: () => void
  onDragEnd: () => void
  dragging: boolean
}) {
  const state = dueState(task.dueDate)

  return (
    <Link
      to={`/tasks/${task._id}`}
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move'
        // Some browsers need payload set for the drag to start.
        e.dataTransfer.setData('text/plain', task._id)
        onDragStart()
      }}
      onDragEnd={onDragEnd}
      className={cn(
        'block cursor-grab rounded-xl border border-border bg-surface p-3 shadow-sm transition',
        'hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md active:cursor-grabbing',
        dragging && 'opacity-40',
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="line-clamp-2-safe text-sm font-semibold leading-snug text-fg">
          {task.title}
        </p>
        <PriorityBadge priority={task.priority} className="shrink-0" />
      </div>

      {task.description ? (
        <p className="line-clamp-2-safe mb-2.5 text-xs leading-relaxed text-muted">
          {task.description}
        </p>
      ) : null}

      {task.tags.length > 0 ? (
        <div className="mb-2.5 flex flex-wrap gap-1">
          {task.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-surface-3 px-1.5 py-0.5 text-[11px] font-medium text-muted"
            >
              {tag}
            </span>
          ))}
        </div>
      ) : null}

      <div className="flex items-center justify-between gap-2 border-t border-border pt-2.5">
        <div className="flex items-center gap-2.5 text-[11px] text-subtle">
          {task.dueDate ? (
            <span
              className={cn(
                'inline-flex items-center gap-1 font-medium',
                state === 'overdue' && 'text-danger',
                state === 'today' && 'text-warning',
              )}
            >
              <CalendarClock size={12} />
              {formatDate(task.dueDate)}
            </span>
          ) : null}
          {task.comments.length > 0 ? (
            <span className="inline-flex items-center gap-1">
              <MessageSquare size={12} />
              {task.comments.length}
            </span>
          ) : null}
          {task.attachments.length > 0 ? (
            <span className="inline-flex items-center gap-1">
              <Paperclip size={12} />
              {task.attachments.length}
            </span>
          ) : null}
        </div>
        <AvatarGroup users={populatedUsers(task.assignedTo)} max={3} size="xs" />
      </div>
    </Link>
  )
}

export function TaskBoard({
  tasks,
  onStatusChange,
  onCreate,
}: {
  tasks: Task[]
  onStatusChange: (taskId: string, status: TaskStatus) => void
  onCreate: () => void
}) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [overColumn, setOverColumn] = useState<TaskStatus | null>(null)

  const draggingTask = tasks.find((t) => t._id === draggingId) ?? null

  const drop = (status: TaskStatus) => {
    if (draggingTask && draggingTask.status !== status) {
      onStatusChange(draggingTask._id, status)
    }
    setDraggingId(null)
    setOverColumn(null)
  }

  return (
    <div className="grid gap-3 lg:grid-cols-4">
      {STATUSES.map((status) => {
        const columnTasks = tasks.filter((t) => t.status === status)
        // While dragging, only columns the backend accepts stay droppable.
        const droppable =
          !draggingTask || canMove(draggingTask.status, status)
        const isOver = overColumn === status && droppable

        return (
          <section
            key={status}
            onDragOver={(e) => {
              if (!droppable) return
              e.preventDefault()
              setOverColumn(status)
            }}
            onDragLeave={() => setOverColumn((c) => (c === status ? null : c))}
            onDrop={(e) => {
              if (!droppable) return
              e.preventDefault()
              drop(status)
            }}
            className={cn(
              'flex min-h-32 flex-col rounded-2xl border bg-surface-2/60 p-2.5 transition',
              isOver
                ? 'border-brand bg-brand-soft/40 ring-2 ring-brand/20'
                : 'border-border',
              draggingTask && !droppable && 'opacity-45',
            )}
          >
            <header className="mb-2.5 flex items-center justify-between px-1 pt-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn('h-2 w-2 rounded-full', STATUS_DOT[status])}
                />
                <h2 className="text-sm font-semibold text-fg">
                  {STATUS_LABEL[status]}
                </h2>
                <span className="rounded-full bg-surface-3 px-1.5 text-xs font-semibold text-muted">
                  {columnTasks.length}
                </span>
              </div>
              {status === 'todo' ? (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={onCreate}
                  aria-label="Create task"
                >
                  <Plus size={15} />
                </Button>
              ) : null}
            </header>

            <div className="flex flex-1 flex-col gap-2">
              {columnTasks.length === 0 ? (
                <p className="rounded-xl border border-dashed border-border px-3 py-6 text-center text-xs text-subtle">
                  {isOver
                    ? 'Release to move here'
                    : droppable
                      ? 'Drag tasks here'
                      : 'Not allowed'}
                </p>
              ) : (
                columnTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    dragging={draggingId === task._id}
                    onDragStart={() => setDraggingId(task._id)}
                    onDragEnd={() => {
                      setDraggingId(null)
                      setOverColumn(null)
                    }}
                  />
                ))
              )}
            </div>
          </section>
        )
      })}
    </div>
  )
}
