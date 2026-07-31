import { apiClient } from '@/lib/apiClient'
import type { CreateTeamPayload, Team, TeamMemberRole } from '../types'

export const teamsApi = {
  create(payload: CreateTeamPayload) {
    return apiClient
      .post<{ message: string; team: Team }>('/teams', payload)
      .then((r) => r.data.team)
  },
  listMine() {
    return apiClient
      .get<{ message: string; teams: Team[] }>('/teams')
      .then((r) => r.data.teams)
  },
  getOne(id: string) {
    return apiClient
      .get<{ message: string; team: Team }>(`/teams/${id}`)
      .then((r) => r.data.team)
  },
  update(id: string, payload: { name?: string; description?: string }) {
    return apiClient
      .patch<{ message: string; team: Team }>(`/teams/${id}`, payload)
      .then((r) => r.data.team)
  },
  remove(id: string) {
    return apiClient.delete(`/teams/${id}`).then((r) => r.data)
  },
  addMember(id: string, userId: string, role: TeamMemberRole = 'member') {
    return apiClient
      .post<{ message: string; team: Team }>(`/teams/${id}/members`, {
        userId,
        role,
      })
      .then((r) => r.data.team)
  },
  removeMember(id: string, userId: string) {
    return apiClient
      .delete<{ message: string; team: Team }>(`/teams/${id}/members/${userId}`)
      .then((r) => r.data.team)
  },
  changeMemberRole(id: string, userId: string, role: TeamMemberRole) {
    return apiClient
      .patch<{ message: string; team: Team }>(
        `/teams/${id}/members/${userId}/role`,
        { role },
      )
      .then((r) => r.data.team)
  },
  leave(id: string) {
    return apiClient.post(`/teams/${id}/leave`).then((r) => r.data)
  },
  transferOwnership(id: string, userId: string) {
    return apiClient
      .patch<{ message: string; team: Team }>(`/teams/${id}/transfer`, {
        userId,
      })
      .then((r) => r.data.team)
  },

  // ── image ──
  /** POST is rejected once an image exists, so switch to PUT for replacements. */
  setImage(id: string, file: File, hasExisting: boolean) {
    const url = `/teams/${id}/image`
    const form = new FormData()
    form.append('image', file)
    const request = hasExisting
      ? apiClient.put<{ message: string; team: Team }>(url, form)
      : apiClient.post<{ message: string; team: Team }>(url, form)
    return request.then((r) => r.data.team)
  },
  removeImage(id: string) {
    return apiClient.delete(`/teams/${id}/image`).then((r) => r.data)
  },
}
