import { apiClient } from '@/lib/apiClient'
import type {
  CreateTaskPayload,
  Task,
  TaskAttachment,
  TaskPriority,
  TaskStatus,
  UpdateTaskPayload,
} from '../types'

export type TaskListParams = {
  status?: TaskStatus
  priority?: TaskPriority
  team?: string
  assignedTo?: string
  dueBefore?: string
  dueAfter?: string
  page?: number
  limit?: number
}

/** Server caps `limit` at 50. */
const MAX_LIMIT = 50
/** Safety net so a huge workspace can't spin forever. */
const MAX_PAGES = 8

export const tasksApi = {
  list(params?: TaskListParams) {
    return apiClient
      .get<{
        message: string
        tasks: Task[]
        page: number
        limit: number
        total: number
      }>('/tasks', { params })
      .then((r) => r.data)
  },

  /**
   * Collect every matching task by walking the paginated endpoint.
   * The board view needs all statuses at once, which one request can't give.
   */
  async listAll(params?: Omit<TaskListParams, 'page' | 'limit'>) {
    const first = await tasksApi.list({ ...params, page: 1, limit: MAX_LIMIT })
    const tasks = [...first.tasks]
    const pages = Math.min(MAX_PAGES, Math.ceil(first.total / MAX_LIMIT) || 1)

    for (let page = 2; page <= pages; page++) {
      const next = await tasksApi.list({ ...params, page, limit: MAX_LIMIT })
      if (next.tasks.length === 0) break
      tasks.push(...next.tasks)
    }

    return { tasks, total: first.total }
  },
  getOne(id: string) {
    return apiClient
      .get<{ message: string; task: Task }>(`/tasks/${id}`)
      .then((r) => r.data.task)
  },
  create(payload: CreateTaskPayload) {
    return apiClient
      .post<{ message: string; task: Task }>('/tasks', payload)
      .then((r) => r.data.task)
  },
  update(id: string, payload: UpdateTaskPayload) {
    return apiClient
      .patch<{ message: string; task: Task }>(`/tasks/${id}`, payload)
      .then((r) => r.data.task)
  },
  changeStatus(id: string, status: TaskStatus) {
    return apiClient
      .patch<{ message: string; task: Task }>(`/tasks/${id}/status`, { status })
      .then((r) => r.data.task)
  },
  assign(id: string, assignedTo: string[]) {
    return apiClient
      .patch<{ message: string; task: Task }>(`/tasks/${id}/assign`, {
        assignedTo,
      })
      .then((r) => r.data.task)
  },
  remove(id: string) {
    return apiClient.delete(`/tasks/${id}`).then((r) => r.data)
  },

  // ── attachments ──
  listAttachments(id: string) {
    return apiClient
      .get<{ message: string; attachments: TaskAttachment[] }>(
        `/tasks/${id}/attachments`,
      )
      .then((r) => r.data.attachments)
  },
  uploadAttachments(id: string, files: File[]) {
    const form = new FormData()
    files.forEach((file) => form.append('attachments', file))
    return apiClient
      .post<{ message: string; task: Task }>(`/tasks/${id}/attachments`, form)
      .then((r) => r.data.task)
  },
  removeAttachment(id: string, publicId: string) {
    return apiClient
      .delete(`/tasks/${id}/attachments`, { data: { public_id: publicId } })
      .then((r) => r.data)
  },
}
