export type NotificationType = 'task' | 'team' | 'chat' | 'system'

export type Notification = {
  _id: string
  user: string
  message: string
  type: NotificationType
  isRead: boolean
  relatedId?: string
  createdAt: string
  updatedAt: string
}
