import { apiClient } from '@/lib/apiClient'
import type { Chat, Message } from '../types'

/** Routes are planned in ROADMAP Phase 9. */
export const chatsApi = {
  listMine() {
    return apiClient
      .get<{ message: string; chats: Chat[] }>('/chats')
      .then((r) => r.data.chats)
  },
  getMessages(chatId: string, params?: { before?: string; limit?: number }) {
    return apiClient
      .get<{ message: string; messages: Message[] }>(
        `/chats/${chatId}/messages`,
        { params },
      )
      .then((r) => r.data.messages)
  },
  send(chatId: string, text: string) {
    return apiClient
      .post<{ message: string; data: Message }>(`/chats/${chatId}/messages`, {
        text,
      })
      .then((r) => r.data.data)
  },
}
