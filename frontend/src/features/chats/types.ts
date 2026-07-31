export type ChatType = 'team' | 'task' | 'direct'

export type ChatUser = {
  _id: string
  name: string
  email?: string
  image?: { secure_url?: string; public_id?: string }
}

export type Message = {
  _id: string
  chat: string
  sender: ChatUser | string
  text?: string
  attachments: Array<{ url: string; type?: string }>
  seenBy: string[]
  createdAt: string
  updatedAt: string
}

export type Chat = {
  _id: string
  type: ChatType
  team?: { _id: string; name: string; image?: { secure_url?: string } } | string
  task?: { _id: string; title: string } | string
  participants: ChatUser[]
  lastMessage?: Message | null
  createdAt: string
  updatedAt: string
}
