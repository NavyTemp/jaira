import { apiClient } from '@/lib/apiClient'
import type {
  CreateTaskPayload,
  Task,
  TaskPriority,
  TaskStatus,
  UpdateTaskPayload,
} from '../types'

export type TaskListParams = {
  status?: TaskStatus
  priority?: TaskPriority
  team?: string
  assignedTo?: string
  page?: number
  limit?: number
}

export const tasksApi = {
  list(params?: TaskListParams) {
    return apiClient
      .get<{ message: string; tasks: Task[]; total: number }>('/tasks', {
        params,
      })
      .then((r) => r.data)
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
}
