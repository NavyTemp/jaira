import { apiClient } from '@/lib/apiClient'
import type { Chat, Message } from '../types'

export const chatsApi = {
  listMine() {
    return apiClient
      .get<{ message: string; chats: Chat[] }>('/chats')
      .then((r) => r.data.chats)
  },
  getOne(id: string) {
    return apiClient
      .get<{ message: string; chat: Chat }>(`/chats/${id}`)
      .then((r) => r.data.chat)
  },
  getOrCreateDirect(userId: string) {
    return apiClient
      .post<{ message: string; chat: Chat }>('/chats/direct', { userId })
      .then((r) => r.data.chat)
  },
  getMessages(chatId: string, params?: { before?: string; limit?: number }) {
    return apiClient
      .get<{ message: string; messages: Message[]; hasMore: boolean }>(
        `/chats/${chatId}/messages`,
        { params },
      )
      .then((r) => r.data)
  },
  send(chatId: string, text: string) {
    return apiClient
      .post<{ message: string; data: Message }>(`/chats/${chatId}/messages`, {
        text,
      })
      .then((r) => r.data.data)
  },
  markSeen(chatId: string, messageId: string) {
    return apiClient
      .patch(`/chats/${chatId}/messages/${messageId}/seen`)
      .then((r) => r.data)
  },
}
