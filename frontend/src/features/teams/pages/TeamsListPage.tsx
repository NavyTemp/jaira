import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Crown, ListChecks, Plus, UsersRound } from 'lucide-react'
import { Card, PageHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Modal } from '@/components/ui/Modal'
import { Avatar, AvatarGroup } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState, ErrorState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { extractApiError } from '@/lib/apiClient'
import { authStorage } from '@/lib/authStorage'
import { displayUser, userId } from '@/lib/format'
import { teamsApi } from '../api/teamsApi'

export function TeamsListPage() {
  const qc = useQueryClient()
  const toast = useToast()
  const me = authStorage.getUser()

  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: teams, isLoading, isError, error: loadError, refetch } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.listMine(),
  })

  const createMut = useMutation({
    mutationFn: () =>
      teamsApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teams'] })
      setOpen(false)
      setName('')
      setDescription('')
      toast.success('Team created')
    },
    onError: (err) => setError(extractApiError(err, 'Could not create team')),
  })

  const list = teams ?? []

  return (
    <div>
      <PageHeader
        title="Teams"
        description="Group people together and share tasks and chat."
        icon={<UsersRound size={19} />}
        actions={
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus size={16} />
            New team
          </Button>
        }
      />

      {isError ? (
        <ErrorState
          message={extractApiError(loadError, 'Could not load teams')}
          onRetry={() => void refetch()}
        />
      ) : isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="space-y-3">
              <Skeleton className="h-12 w-12 rounded-xl" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </Card>
          ))}
        </div>
      ) : list.length === 0 ? (
        <Card>
          <EmptyState
            icon={<UsersRound size={24} />}
            title="No teams yet"
            message="Create a team to collaborate on tasks, share a chat and track progress together."
            action={
              <Button onClick={() => setOpen(true)}>
                <Plus size={16} />
                Create your first team
              </Button>
            }
          />
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((team) => {
            const isOwner = userId(team.ownerId) === me?._id
            return (
              <Link key={team._id} to={`/teams/${team._id}`} className="group">
                <Card className="flex h-full flex-col transition hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <Avatar
                      name={team.name}
                      seed={team._id}
                      src={team.image?.secure_url}
                      size="lg"
                      className="rounded-2xl"
                    />
                    {isOwner ? (
                      <Badge tone="warning">
                        <Crown size={11} />
                        Owner
                      </Badge>
                    ) : null}
                  </div>

                  <h2 className="truncate font-semibold text-fg">{team.name}</h2>
                  <p className="mt-1 line-clamp-2-safe flex-1 text-sm leading-relaxed text-muted">
                    {team.description || 'No description yet.'}
                  </p>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3.5">
                    <AvatarGroup
                      users={team.members.map((m) => m.user)}
                      max={4}
                      size="xs"
                    />
                    <span className="flex items-center gap-1 text-xs font-medium text-muted">
                      <ListChecks size={13} />
                      {team.tasksId.length} task
                      {team.tasksId.length === 1 ? '' : 's'}
                    </span>
                  </div>

                  {!isOwner ? (
                    <p className="mt-2 truncate text-xs text-subtle">
                      Owned by {displayUser(team.ownerId)}
                    </p>
                  ) : null}
                </Card>
              </Link>
            )
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create a team"
        description="You'll become the owner and can invite members next."
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={createMut.isPending}
            >
              Cancel
            </Button>
            <Button
              form="team-form"
              type="submit"
              loading={createMut.isPending}
              disabled={name.trim().length < 2}
            >
              Create team
            </Button>
          </>
        }
      >
        <form
          id="team-form"
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault()
            setError(null)
            createMut.mutate()
          }}
        >
          <Input
            label="Team name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Product Engineering"
            required
            autoFocus
          />
          <Textarea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this team work on?"
          />
          {error ? <ErrorState message={error} /> : null}
        </form>
      </Modal>
    </div>
  )
}
