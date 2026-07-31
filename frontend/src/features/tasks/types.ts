export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export type UserLite = {
  _id: string
  name: string
  email?: string
  image?: { secure_url?: string; public_id?: string }
}

export type TeamRef = { _id: string; name: string }

export type TaskComment = {
  _id: string
  user: UserLite | string
  text: string
  createdAt: string
}

export type TaskAttachment = {
  _id?: string
  secure_url: string
  public_id: string
  uploadedBy?: string
  createdAt?: string
}

export type Task = {
  _id: string
  title: string
  description?: string
  status: TaskStatus
  priority: TaskPriority
  dueDate?: string
  createdBy: UserLite | string
  assignedTo: Array<UserLite | string>
  team?: TeamRef | string
  chat?: string
  comments: TaskComment[]
  attachments: TaskAttachment[]
  tags: string[]
  createdAt: string
  updatedAt: string
}

export type CreateTaskPayload = {
  title: string
  description?: string
  priority?: TaskPriority
  dueDate?: string
  team?: string
  assignedTo?: string[]
  tags?: string[]
}

export type UpdateTaskPayload = Partial<
  Pick<Task, 'title' | 'description' | 'priority' | 'dueDate' | 'tags'>
>
