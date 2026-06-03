import { apiClient } from '@/lib/apiClient'
import type { CreateTaskPayload, Task, TaskStatus } from '../types'

/**
 * The `/tasks` routes do not exist on the backend yet (ROADMAP Phase 4).
 * Functions are kept thin so they slot in unchanged once the controller lands.
 */
export const tasksApi = {
  list(params?: {
    status?: TaskStatus
    team?: string
    assignedTo?: string
    page?: number
    limit?: number
  }) {
    return apiClient
      .get<{ message: string; tasks: Task[] }>('/tasks', { params })
      .then((r) => r.data.tasks)
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
  update(id: string, payload: Partial<CreateTaskPayload>) {
    return apiClient.patch(`/tasks/${id}`, payload).then((r) => r.data)
  },
  changeStatus(id: string, status: TaskStatus) {
    return apiClient.patch(`/tasks/${id}/status`, { status }).then((r) => r.data)
  },
  remove(id: string) {
    return apiClient.delete(`/tasks/${id}`).then((r) => r.data)
  },
}
