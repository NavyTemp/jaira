import { apiClient } from '@/lib/apiClient'
import type { Comment } from '../types'

/** Routes are planned in ROADMAP Phase 5. */
export const commentsApi = {
  listForTask(taskId: string) {
    return apiClient
      .get<{ message: string; comments: Comment[] }>(
        `/tasks/${taskId}/comments`,
      )
      .then((r) => r.data.comments)
  },
  add(taskId: string, text: string) {
    return apiClient
      .post<{ message: string; comment: Comment }>(
        `/tasks/${taskId}/comments`,
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
