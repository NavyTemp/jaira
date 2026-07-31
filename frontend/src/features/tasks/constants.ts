import type { TaskPriority, TaskStatus } from './types'

export const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']
export const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

/**
 * Mirrors `allowedTransitions` in the backend task service. Keeping it here
 * lets the UI hide impossible moves instead of surfacing a 400.
 */
export const ALLOWED_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  todo: ['in_progress'],
  in_progress: ['review', 'todo'],
  review: ['done', 'in_progress'],
  done: [],
}

export function canMove(from: TaskStatus, to: TaskStatus): boolean {
  return from === to || ALLOWED_TRANSITIONS[from].includes(to)
}

export const STATUS_LABEL: Record<TaskStatus, string> = {
  todo: 'To do',
  in_progress: 'In progress',
  review: 'In review',
  done: 'Done',
}

/** Dot colours shared by the status badge and the board columns. */
export const STATUS_DOT: Record<TaskStatus, string> = {
  todo: 'bg-subtle',
  in_progress: 'bg-info',
  review: 'bg-warning',
  done: 'bg-success',
}

export const PRIORITY_LABEL: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  urgent: 'Urgent',
}
