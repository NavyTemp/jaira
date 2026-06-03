export type TeamMemberRole = 'member' | 'admin'

export type TeamMember = {
  user: string
  role: TeamMemberRole
}

export type Team = {
  _id: string
  name: string
  description?: string
  ownerId: string
  members: TeamMember[]
  tasksId: string[]
  chat?: string
  createdAt: string
  updatedAt: string
}

export type CreateTeamPayload = {
  name: string
  description?: string
  membersId: string[]
}
