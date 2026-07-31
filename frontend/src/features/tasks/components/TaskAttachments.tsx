import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, FileText, Paperclip, Trash2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { CardHeader, CardTitle } from '@/components/ui/Card'
import { EmptyState } from '@/components/ui/EmptyState'
import { ConfirmDialog } from '@/components/ui/Modal'
import { useToast } from '@/components/ui/Toast'
import { extractApiError } from '@/lib/apiClient'
import { fileNameFromUrl, isImageUrl, relativeTime } from '@/lib/format'
import { tasksApi } from '../api/tasksApi'
import type { TaskAttachment } from '../types'

const MAX_BYTES = 10 * 1024 * 1024

export function TaskAttachments({
  taskId,
  attachments,
}: {
  taskId: string
  attachments: TaskAttachment[]
}) {
  const qc = useQueryClient()
  const toast = useToast()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pendingDelete, setPendingDelete] = useState<TaskAttachment | null>(null)

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['task', taskId] })
    qc.invalidateQueries({ queryKey: ['tasks'] })
  }

  const uploadMut = useMutation({
    mutationFn: (files: File[]) => tasksApi.uploadAttachments(taskId, files),
    onSuccess: (_, files) => {
      invalidate()
      toast.success(
        `${files.length} file${files.length === 1 ? '' : 's'} uploaded`,
      )
    },
    onError: (err) => toast.error(extractApiError(err, 'Upload failed')),
  })

  const deleteMut = useMutation({
    mutationFn: (publicId: string) => tasksApi.removeAttachment(taskId, publicId),
    onSuccess: () => {
      invalidate()
      setPendingDelete(null)
      toast.success('Attachment removed')
    },
    onError: (err) => toast.error(extractApiError(err, 'Could not remove file')),
  })

  const onPick = (fileList: FileList | null) => {
    if (!fileList?.length) return
    const files = Array.from(fileList)
    const tooBig = files.find((f) => f.size > MAX_BYTES)
    if (tooBig) {
      toast.error(`"${tooBig.name}" is larger than 10 MB.`)
      return
    }
    uploadMut.mutate(files)
  }

  return (
    <>
      <CardHeader className="mb-4">
        <CardTitle>Attachments ({attachments.length})</CardTitle>
        <Button
          size="sm"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          loading={uploadMut.isPending}
        >
          <Upload size={15} />
          Upload
        </Button>
      </CardHeader>

      <input
        ref={inputRef}
        type="file"
        multiple
        hidden
        onChange={(e) => {
          onPick(e.target.files)
          e.target.value = ''
        }}
      />

      <div
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault()
          onPick(e.dataTransfer.files)
        }}
      >
        {attachments.length === 0 ? (
          <EmptyState
            compact
            icon={<Paperclip size={22} />}
            title="No attachments"
            message="Drag files here, or use the upload button. Up to 10 MB each."
          />
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {attachments.map((file) => {
              const name = fileNameFromUrl(file.secure_url)
              return (
                <li
                  key={file.public_id}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-surface-2 p-2.5 transition hover:border-border-strong"
                >
                  {isImageUrl(file.secure_url) ? (
                    <img
                      src={file.secure_url}
                      alt={name}
                      loading="lazy"
                      className="h-11 w-11 shrink-0 rounded-lg object-cover"
                    />
                  ) : (
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-surface-3 text-subtle">
                      <FileText size={18} />
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-fg">{name}</p>
                    <p className="text-xs text-muted">
                      {file.createdAt ? relativeTime(file.createdAt) : 'Uploaded'}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-0.5">
                    <a
                      href={file.secure_url}
                      target="_blank"
                      rel="noreferrer"
                      title="Open file"
                      className="grid h-8 w-8 place-items-center rounded-lg text-subtle transition hover:bg-surface-3 hover:text-fg"
                    >
                      <Download size={15} />
                    </a>
                    <button
                      onClick={() => setPendingDelete(file)}
                      title="Delete file"
                      className="grid h-8 w-8 place-items-center rounded-lg text-subtle transition hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <ConfirmDialog
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => {
          if (pendingDelete) deleteMut.mutate(pendingDelete.public_id)
        }}
        loading={deleteMut.isPending}
        title="Delete attachment"
        message={
          pendingDelete
            ? `"${fileNameFromUrl(pendingDelete.secure_url)}" will be permanently removed.`
            : ''
        }
        confirmLabel="Delete"
      />
    </>
  )
}
