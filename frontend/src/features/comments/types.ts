export type CommentUser = {
  _id: string
  name: string
  email?: string
  image?: { secure_url?: string; public_id?: string }
}

export type TaskComment = {
  _id: string
  user: CommentUser | string
  text: string
  createdAt: string
}
