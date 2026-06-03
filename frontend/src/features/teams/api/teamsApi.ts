import { apiClient } from '@/lib/apiClient'
import type { CreateTeamPayload, Team } from '../types'

/**
 * Backend currently exposes only `POST /teams/createTeam`.
 * The list / detail / member endpoints below are placeholders that align with
 * the routes planned in ROADMAP.md › Phase 3.
 */
export const teamsApi = {
  create(payload: CreateTeamPayload) {
    return apiClient
      .post<{ message: string; team: Team }>('/teams/createTeam', payload)
      .then((r) => r.data.team)
  },
  listMine() {
    return apiClient
      .get<{ message: string; teams: Team[] }>('/teams/me')
      .then((r) => r.data.teams)
  },
  getOne(id: string) {
    return apiClient
      .get<{ message: string; team: Team }>(`/teams/${id}`)
      .then((r) => r.data.team)
  },
}
