export type TeamMemberRole = 'member' | 'admin'

export type UserLite = {
  _id: string
  name: string
  email: string
  image?: { secure_url?: string; public_id?: string }
}

export type TeamMember = {
  user: UserLite
  role: TeamMemberRole
}

export type Team = {
  _id: string
  name: string
  description?: string
  ownerId: UserLite
  members: TeamMember[]
  tasksId: string[]
  chat?: string
  image?: { secure_url?: string; public_id?: string }
  createdAt: string
  updatedAt: string
}

export type CreateTeamPayload = {
  name: string
  description?: string
  membersId?: string[]
}
