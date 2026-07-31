import { apiClient } from '@/lib/apiClient'
import type { Notification } from '../types'

export const notificationsApi = {
  list(params?: { unread?: boolean; page?: number; limit?: number }) {
    return apiClient
      .get<{
        message: string
        notifications: Notification[]
        unreadCount: number
        total: number
      }>('/notifications', { params })
      .then((r) => r.data)
  },
  markRead(id: string) {
    return apiClient.patch(`/notifications/${id}/read`).then((r) => r.data)
  },
  markAllRead() {
    return apiClient.patch('/notifications/read-all').then((r) => r.data)
  },
  remove(id: string) {
    return apiClient.delete(`/notifications/${id}`).then((r) => r.data)
  },
}
