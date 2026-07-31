import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { extractApiError } from '@/lib/apiClient'
import { displayUser } from '@/lib/format'
import { authStorage } from '@/lib/authStorage'
import { teamsApi } from '../api/teamsApi'
import type { TeamMemberRole } from '../types'

type TaskRef = { _id: string; title: string; status?: string }

export function TeamDetailPage() {
  const { id = '' } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const me = authStorage.getUser()

  const [newUserId, setNewUserId] = useState('')
  const [newRole, setNewRole] = useState<TeamMemberRole>('member')
  const [error, setError] = useState<string | null>(null)

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamsApi.getOne(id),
    enabled: !!id,
  })

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['team', id] })
    qc.invalidateQueries({ queryKey: ['teams'] })
  }

  const addMut = useMutation({
    mutationFn: () => teamsApi.addMember(id, newUserId.trim(), newRole),
    onSuccess: () => {
      setNewUserId('')
      invalidate()
    },
    onError: (err) => setError(extractApiError(err)),
  })
  const removeMut = useMutation({
    mutationFn: (userId: string) => teamsApi.removeMember(id, userId),
    onSuccess: invalidate,
    onError: (err) => setError(extractApiError(err)),
  })
  const roleMut = useMutation({
    mutationFn: (args: { userId: string; role: TeamMemberRole }) =>
      teamsApi.changeMemberRole(id, args.userId, args.role),
    onSuccess: invalidate,
    onError: (err) => setError(extractApiError(err)),
  })
  const leaveMut = useMutation({
    mutationFn: () => teamsApi.leave(id),
    onSuccess: () => {
      invalidate()
      navigate('/teams', { replace: true })
    },
    onError: (err) => setError(extractApiError(err)),
  })
  const deleteMut = useMutation({
    mutationFn: () => teamsApi.remove(id),
    onSuccess: () => {
      invalidate()
      navigate('/teams', { replace: true })
    },
    onError: (err) => setError(extractApiError(err)),
  })

  if (isLoading) return <Card><p className="text-sm text-slate-500">Loading…</p></Card>
  if (!team) return <Card><p className="text-sm text-slate-500">Team not found.</p></Card>

  const isOwner = team.ownerId._id === me?._id
  const myMembership = team.members.find((m) => m.user._id === me?._id)
  const isManager = isOwner || myMembership?.role === 'admin'
  const tasks = (team.tasksId as unknown as TaskRef[]) ?? []

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>{team.name}</CardTitle>
          <div className="flex gap-2">
            {team.chat ? (
              <Link to={`/chats?chat=${team.chat}`}>
                <Button size="sm" variant="ghost">
                  Team chat
                </Button>
              </Link>
            ) : null}
            {!isOwner ? (
              <Button
                size="sm"
                variant="secondary"
                onClick={() => leaveMut.mutate()}
                loading={leaveMut.isPending}
              >
                Leave
              </Button>
            ) : (
              <Button
                size="sm"
                variant="danger"
                onClick={() => deleteMut.mutate()}
                loading={deleteMut.isPending}
              >
                Delete team
              </Button>
            )}
          </div>
        </CardHeader>
        <p className="text-sm text-slate-600">
          {team.description || 'No description'}
        </p>
        <p className="mt-1 text-xs text-slate-400">
          Owner: {displayUser(team.ownerId)}
        </p>
        {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Members ({team.members.length})</CardTitle>
        </CardHeader>

        <ul className="divide-y divide-slate-100">
          {team.members.map((m) => (
            <li
              key={m.user._id}
              className="flex items-center justify-between py-2"
            >
              <div>
                <span className="text-sm font-medium text-slate-900">
                  {m.user.name}
                </span>
                <span className="ml-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                  {team.ownerId._id === m.user._id ? 'owner' : m.role}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {isOwner && team.ownerId._id !== m.user._id ? (
                  <select
                    className="h-8 rounded-md border border-slate-300 bg-white px-2 text-xs"
                    value={m.role}
                    onChange={(e) =>
                      roleMut.mutate({
                        userId: m.user._id,
                        role: e.target.value as TeamMemberRole,
                      })
                    }
                  >
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
                ) : null}
                {isManager && team.ownerId._id !== m.user._id ? (
                  <button
                    onClick={() => removeMut.mutate(m.user._id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    remove
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>

        {isManager ? (
          <form
            className="mt-4 flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault()
              setError(null)
              if (newUserId.trim()) addMut.mutate()
            }}
          >
            <div className="flex-1">
              <Input
                label="Add member by user ID"
                placeholder="Mongo ObjectId"
                value={newUserId}
                onChange={(e) => setNewUserId(e.target.value)}
              />
            </div>
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-2 text-sm"
              value={newRole}
              onChange={(e) => setNewRole(e.target.value as TeamMemberRole)}
            >
              <option value="member">member</option>
              <option value="admin">admin</option>
            </select>
            <Button type="submit" loading={addMut.isPending}>
              Add
            </Button>
          </form>
        ) : null}
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tasks ({tasks.length})</CardTitle>
        </CardHeader>
        {tasks.length === 0 ? (
          <p className="text-sm text-slate-500">No tasks in this team yet.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {tasks.map((t) => (
              <li key={t._id}>
                <Link
                  to={`/tasks/${t._id}`}
                  className="flex items-center justify-between py-2 hover:bg-slate-50"
                >
                  <span className="text-sm text-slate-900">{t.title}</span>
                  {t.status ? (
                    <span className="text-xs text-slate-400">{t.status}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  )
}
