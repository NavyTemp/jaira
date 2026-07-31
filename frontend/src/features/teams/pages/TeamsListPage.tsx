import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { extractApiError } from '@/lib/apiClient'
import { displayUser } from '@/lib/format'
import { teamsApi } from '../api/teamsApi'

export function TeamsListPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: teams, isLoading } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.listMine(),
  })

  const createMut = useMutation({
    mutationFn: () => teamsApi.create({ name, description: description || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      setOpen(false)
      setName('')
      setDescription('')
    },
    onError: (err) => setError(extractApiError(err, 'Could not create team')),
  })

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Teams</CardTitle>
          <Button size="sm" onClick={() => setOpen(true)}>
            New team
          </Button>
        </CardHeader>

        {isLoading ? (
          <p className="text-sm text-slate-500">Loading…</p>
        ) : (teams ?? []).length === 0 ? (
          <p className="text-sm text-slate-500">
            You're not in any teams yet. Create one to start collaborating.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {(teams ?? []).map((t) => (
              <li key={t._id}>
                <Link
                  to={`/teams/${t._id}`}
                  className="block rounded-lg border border-slate-200 p-4 hover:border-slate-300 hover:bg-slate-50"
                >
                  <p className="font-medium text-slate-900">{t.name}</p>
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                    {t.description || 'No description'}
                  </p>
                  <p className="mt-2 text-xs text-slate-400">
                    {t.members.length} member(s) · owner {displayUser(t.ownerId)}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Modal open={open} onClose={() => setOpen(false)} title="Create team">
        <form
          className="space-y-3"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            createMut.mutate()
          }}
        >
          <Input
            label="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Description</span>
            <textarea
              className="min-h-20 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={createMut.isPending}>
              Create
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
