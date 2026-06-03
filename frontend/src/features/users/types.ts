export type UserRole = 'user' | 'admin'
export type UserGender = 'male' | 'female'
export type UserStatus = 'active' | 'inactive'

export type User = {
  _id: string
  name: string
  email: string
  phone: string
  age: number
  role: UserRole
  gender: UserGender
  status: UserStatus
  image?: { secure_url?: string; public_id?: string }
  confirm: boolean
  isDeleted: boolean
  teams: string[]
  createdAt: string
  updatedAt: string
}
