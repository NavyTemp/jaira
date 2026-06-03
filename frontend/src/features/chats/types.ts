export type ChatType = 'team' | 'task' | 'direct'

export type Chat = {
  _id: string
  type: ChatType
  team?: string
  task?: string
  participants: string[]
  lastMessage?: string
  createdAt: string
  updatedAt: string
}

export type Message = {
  _id: string
  chat: string
  sender: string
  text?: string
  attachments: Array<{ url: string; type: string }>
  seenBy: string[]
  createdAt: string
  updatedAt: string
}
