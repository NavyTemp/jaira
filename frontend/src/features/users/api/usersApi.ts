import { apiClient } from '@/lib/apiClient'
import type { User } from '../types'

function imageForm(file: File): FormData {
  const form = new FormData()
  form.append('image', file)
  return form
}

export const usersApi = {
  // ── self ──
  me() {
    return apiClient
      .get<{ message: string; user: User }>('/users/me')
      .then((r) => r.data.user)
  },
  updateProfile(
    payload: Partial<Pick<User, 'name' | 'age' | 'gender' | 'phone'>>,
  ) {
    return apiClient
      .patch<{ message: string; user: User }>('/users/me', payload)
      .then((r) => r.data.user)
  },
  updateEmail(newEmail: string) {
    return apiClient
      .patch('/users/me/email', { newEmail })
      .then((r) => r.data)
  },
  changePassword(oldPassword: string, newPassword: string) {
    return apiClient
      .patch('/users/me/password', { oldPassword, newPassword })
      .then((r) => r.data)
  },
  deleteSelf() {
    return apiClient.delete('/users/me').then((r) => r.data)
  },

  // ── avatar ──
  /**
   * The API rejects POST when an image already exists, so pick the verb
   * based on whether the account currently has one.
   */
  setAvatar(file: File, hasExisting: boolean) {
    const url = '/users/me/image'
    const form = imageForm(file)
    const request = hasExisting
      ? apiClient.put<{ message: string; user: User }>(url, form)
      : apiClient.post<{ message: string; user: User }>(url, form)
    return request.then((r) => r.data.user)
  },
  removeAvatar() {
    return apiClient.delete('/users/me/image').then((r) => r.data)
  },

  // ── admin ──
  list() {
    return apiClient
      .get<{ message: string; users: User[] }>('/users')
      .then((r) => r.data.users)
  },
  getOne(id: string) {
    return apiClient
      .get<{ message: string; user: User }>(`/users/${id}`)
      .then((r) => r.data.user)
  },
  remove(id: string) {
    return apiClient.delete(`/users/${id}`).then((r) => r.data)
  },
}
