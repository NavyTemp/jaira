import { apiClient } from '@/lib/apiClient'
import type { TaskComment } from '../types'

/** Comments are embedded on the task document (`/tasks/:id/comments`). */
export const commentsApi = {
  listForTask(taskId: string) {
    return apiClient
      .get<{ message: string; comments: TaskComment[] }>(
        `/tasks/${taskId}/comments`,
      )
      .then((r) => r.data.comments)
  },
  add(taskId: string, text: string) {
    return apiClient
      .post<{ message: string; comments: TaskComment[] }>(
        `/tasks/${taskId}/comments`,
        { text },
      )
      .then((r) => r.data.comments)
  },
  update(taskId: string, commentId: string, text: string) {
    return apiClient
      .patch<{ message: string; comment: TaskComment }>(
        `/tasks/${taskId}/comments/${commentId}`,
        { text },
      )
      .then((r) => r.data.comment)
  },
  remove(taskId: string, commentId: string) {
    return apiClient
      .delete(`/tasks/${taskId}/comments/${commentId}`)
      .then((r) => r.data)
  },
}
