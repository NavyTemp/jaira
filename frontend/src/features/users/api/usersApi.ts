import { apiClient } from '@/lib/apiClient'
import type { User } from '../types'

export const usersApi = {
  list() {
    return apiClient
      .get<{ message: string; users: User[] }>('/users/getusers')
      .then((r) => r.data.users)
  },
  getOne(id: string) {
    return apiClient
      .get<{ message: string; user: User }>(`/users/getuser/${id}`)
      .then((r) => r.data.user)
  },
  updateProfile(payload: Partial<Pick<User, 'name' | 'age' | 'gender' | 'phone'>>) {
    return apiClient.post('/users/upDateOneuser', payload).then((r) => r.data)
  },
  updateEmail(newEmail: string) {
    return apiClient.post('/users/upEmail', { newEmail }).then((r) => r.data)
  },
  deleteSelf() {
    return apiClient.delete('/users/deleteuser').then((r) => r.data)
  },
}
