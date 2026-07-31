import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Input, Select, Textarea } from '@/components/ui/Input'
import { ErrorState } from '@/components/ui/EmptyState'
import { useToast } from '@/components/ui/Toast'
import { extractApiError } from '@/lib/apiClient'
import { teamsApi } from '@/features/teams/api/teamsApi'
import { tasksApi } from '../api/tasksApi'
import { PRIORITIES, PRIORITY_LABEL } from '../constants'
import type { Task, TaskPriority } from '../types'

/** `<input type="date">` needs a bare `YYYY-MM-DD` value. */
function toDateInput(value?: string): string {
  if (!value) return ''
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10)
}

/**
 * Thin wrapper so the form below mounts fresh every time the dialog opens,
 * which keeps its initial state derived straight from props.
 */
export function TaskFormModal({
  open,
  onClose,
  /** Present = edit mode; absent = create mode. */
  task,
  defaultTeam,
}: {
  open: boolean
  onClose: () => void
  task?: Task
  defaultTeam?: string
}) {
  if (!open) return null
  return (
    <TaskForm
      key={task?._id ?? 'new'}
      onClose={onClose}
      task={task}
      defaultTeam={defaultTeam}
    />
  )
}

function TaskForm({
  onClose,
  task,
  defaultTeam,
}: {
  onClose: () => void
  task?: Task
  defaultTeam?: string
}) {
  const qc = useQueryClient()
  const toast = useToast()
  const isEdit = !!task

  const [title, setTitle] = useState(task?.title ?? '')
  const [description, setDescription] = useState(task?.description ?? '')
  const [priority, setPriority] = useState<TaskPriority>(
    task?.priority ?? 'medium',
  )
  const [dueDate, setDueDate] = useState(toDateInput(task?.dueDate))
  const [team, setTeam] = useState(
    typeof task?.team === 'object' && task.team
      ? task.team._id
      : typeof task?.team === 'string'
        ? task.team
        : (defaultTeam ?? ''),
  )
  const [tags, setTags] = useState<string[]>(task?.tags ?? [])
  const [tagDraft, setTagDraft] = useState('')
  const [error, setError] = useState<string | null>(null)

  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.listMine(),
  })

  const mutation = useMutation({
    mutationFn: () => {
      const shared = {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        tags,
      }
      return isEdit
        ? tasksApi.update(task._id, shared)
        : tasksApi.create({ ...shared, team: team || undefined })
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      if (isEdit) qc.invalidateQueries({ queryKey: ['task', updated._id] })
      toast.success(isEdit ? 'Task updated' : 'Task created')
      onClose()
    },
    onError: (err) =>
      setError(
        extractApiError(err, isEdit ? 'Could not update task' : 'Could not create task'),
      ),
  })

  const addTag = () => {
    const value = tagDraft.trim()
    if (!value) return
    if (!tags.includes(value)) setTags([...tags, value])
    setTagDraft('')
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit task' : 'Create a task'}
      description={
        isEdit
          ? 'Update the details of this task.'
          : 'Add a task to your personal list or a team board.'
      }
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={mutation.isPending}>
            Cancel
          </Button>
          <Button
            form="task-form"
            type="submit"
            loading={mutation.isPending}
            disabled={title.trim().length < 2}
          >
            {isEdit ? 'Save changes' : 'Create task'}
          </Button>
        </>
      }
    >
      <form
        id="task-form"
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          setError(null)
          mutation.mutate()
        }}
      >
        <Input
          label="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Ship the onboarding flow"
          maxLength={200}
          required
          autoFocus
        />

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add context, links or acceptance criteria…"
          maxLength={2000}
          hint={`${description.length}/2000`}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as TaskPriority)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </option>
            ))}
          </Select>
          <Input
            label="Due date"
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
          />
        </div>

        {!isEdit ? (
          <Select
            label="Team"
            value={team}
            onChange={(e) => setTeam(e.target.value)}
            hint="A team task also gets its own chat thread."
          >
            <option value="">Personal task</option>
            {(teams ?? []).map((t) => (
              <option key={t._id} value={t._id}>
                {t.name}
              </option>
            ))}
          </Select>
        ) : null}

        <div>
          <label className="mb-1.5 block text-sm font-medium text-fg">Tags</label>
          <div className="flex gap-2">
            <Input
              value={tagDraft}
              onChange={(e) => setTagDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ',') {
                  e.preventDefault()
                  addTag()
                }
              }}
              placeholder="Type a tag and press Enter"
              className="flex-1"
            />
            <Button type="button" variant="outline" onClick={addTag}>
              Add
            </Button>
          </div>
          {tags.length > 0 ? (
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 rounded-full bg-surface-3 px-2.5 py-1 text-xs font-medium text-fg"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => setTags(tags.filter((t) => t !== tag))}
                    className="text-subtle transition hover:text-danger"
                    aria-label={`Remove ${tag}`}
                  >
                    <X size={12} />
                  </button>
                </span>
              ))}
            </div>
          ) : null}
        </div>

        {error ? <ErrorState message={error} /> : null}
      </form>
    </Modal>
  )
}
