import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Check, MessageSquare, Pencil, Send, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CardHeader, CardTitle } from '@/components/ui/Card'
import { Avatar } from '@/components/ui/Avatar'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { extractApiError } from '@/lib/apiClient'
import { authStorage } from '@/lib/authStorage'
import { displayUser, relativeTime, userId } from '@/lib/format'
import { commentsApi } from '@/features/comments/api/commentsApi'
import type { TaskComment } from '../types'

export function TaskComments({
  taskId,
  comments,
}: {
  taskId: string
  comments: TaskComment[]
}) {
  const qc = useQueryClient()
  const toast = useToast()
  const me = authStorage.getUser()

  const [draft, setDraft] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [pendingDelete, setPendingDelete] = useState<string | null>(null)

  const invalidate = () => qc.invalidateQueries({ queryKey: ['task', taskId] })

  const addMut = useMutation({
    mutationFn: () => commentsApi.add(taskId, draft.trim()),
    onSuccess: () => {
      setDraft('')
      invalidate()
    },
    onError: (err) => toast.error(extractApiError(err, 'Could not post comment')),
  })

  const editMut = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      commentsApi.update(taskId, id, text),
    onSuccess: () => {
      setEditingId(null)
      setEditDraft('')
      invalidate()
      toast.success('Comment updated')
    },
    onError: (err) => toast.error(extractApiError(err, 'Could not edit comment')),
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => commentsApi.remove(taskId, id),
    onSuccess: () => {
      setPendingDelete(null)
      invalidate()
    },
    onError: (err) => toast.error(extractApiError(err, 'Could not delete comment')),
  })

  const ordered = [...comments].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  )

  return (
    <>
      <CardHeader className="mb-4">
        <CardTitle>Comments ({comments.length})</CardTitle>
      </CardHeader>

      <form
        className="mb-5 flex items-start gap-2.5"
        onSubmit={(e) => {
          e.preventDefault()
          if (draft.trim()) addMut.mutate()
        }}
      >
        <Avatar name={me?.name} seed={me?._id} size="sm" className="mt-0.5" />
        <div className="flex-1">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              // ⌘/Ctrl+Enter submits without leaving the keyboard.
              if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault()
                if (draft.trim()) addMut.mutate()
              }
            }}
            rows={2}
            maxLength={2000}
            placeholder="Write a comment…"
            className="w-full resize-y rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-fg transition placeholder:text-subtle hover:border-border-strong focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-subtle">⌘ + Enter to send</span>
            <Button
              type="submit"
              size="sm"
              loading={addMut.isPending}
              disabled={!draft.trim()}
            >
              <Send size={14} />
              Comment
            </Button>
          </div>
        </div>
      </form>

      {ordered.length === 0 ? (
        <EmptyState
          compact
          icon={<MessageSquare size={22} />}
          title="No comments yet"
          message="Start the discussion for this task."
        />
      ) : (
        <ul className="space-y-4">
          {ordered.map((c) => {
            const mine = userId(c.user) === me?._id
            const editing = editingId === c._id

            return (
              <li key={c._id} className="flex items-start gap-2.5">
                <Avatar
                  name={displayUser(c.user)}
                  seed={userId(c.user)}
                  src={
                    typeof c.user === 'object' ? c.user.image?.secure_url : undefined
                  }
                  size="sm"
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <div className="rounded-xl rounded-tl-sm border border-border bg-surface-2 px-3.5 py-2.5">
                    <div className="mb-1 flex items-center gap-2">
                      <span className="text-sm font-semibold text-fg">
                        {mine ? 'You' : displayUser(c.user)}
                      </span>
                      <span className="text-xs text-subtle">
                        {relativeTime(c.createdAt)}
                      </span>
                    </div>

                    {editing ? (
                      <div>
                        <textarea
                          value={editDraft}
                          onChange={(e) => setEditDraft(e.target.value)}
                          rows={2}
                          maxLength={2000}
                          autoFocus
                          className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm text-fg focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
                        />
                        <div className="mt-2 flex gap-2">
                          <Button
                            size="xs"
                            loading={editMut.isPending}
                            disabled={!editDraft.trim()}
                            onClick={() =>
                              editMut.mutate({ id: c._id, text: editDraft.trim() })
                            }
                          >
                            <Check size={13} />
                            Save
                          </Button>
                          <Button
                            size="xs"
                            variant="ghost"
                            onClick={() => setEditingId(null)}
                          >
                            <X size={13} />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed text-fg">
                        {c.text}
                      </p>
                    )}
                  </div>

                  {mine && !editing ? (
                    <div className="mt-1 flex gap-3 pl-1">
                      <button
                        onClick={() => {
                          setEditingId(c._id)
                          setEditDraft(c.text)
                        }}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted transition hover:text-fg"
                      >
                        <Pencil size={11} />
                        Edit
                      </button>
                      <button
                        onClick={() => setPendingDelete(c._id)}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted transition hover:text-danger"
                      >
                        <Trash2 size={11} />
                        Delete
                      </button>
                    </div>
                  ) : null}
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMut.mutate(pendingDelete)
        }}
        loading={deleteMut.isPending}
        title="Delete comment"
        message="This comment will be permanently removed."
        confirmLabel="Delete"
      />
    </>
  )
}
