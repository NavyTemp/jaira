export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type TaskAttachment = {
  url: string
  type: string
}

export type Task = {
  _id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  createdBy: string
  assignedTo?: string
  team?: string
  chat?: string
  attachments: TaskAttachment[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type CreateTaskPayload = {
  title: string
  description?: string
  status?: TaskStatus
  priority?: TaskPriority
  dueDate?: string
  assignedTo?: string
  team?: string
  tags?: string[]
}
