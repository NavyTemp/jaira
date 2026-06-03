import { apiClient } from '@/lib/apiClient'
import type { Notification } from '../types'

/** Routes are planned in ROADMAP Phase 8. */
export const notificationsApi = {
  list(params?: { unread?: boolean }) {
    return apiClient
      .get<{ message: string; notifications: Notification[] }>(
        '/notifications',
        { params },
      )
      .then((r) => r.data.notifications)
  },
  markRead(id: string) {
    return apiClient.patch(`/notifications/${id}/read`).then((r) => r.data)
  },
  markAllRead() {
    return apiClient.patch('/notifications/read-all').then((r) => r.data)
  },
}
