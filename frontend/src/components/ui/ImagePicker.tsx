import { useEffect, useRef, useState } from 'react'
import { Camera, Loader2, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Avatar } from './Avatar'
import { Button } from './Button'

const MAX_BYTES = 5 * 1024 * 1024

export function ImagePicker({
  name,
  seed,
  src,
  size = 'xl',
  rounded = 'full',
  uploading = false,
  removing = false,
  onSelect,
  onRemove,
  disabled = false,
}: {
  name?: string
  seed?: string
  src?: string | null
  size?: 'lg' | 'xl'
  rounded?: 'full' | 'xl'
  uploading?: boolean
  removing?: boolean
  onSelect: (file: File) => void
  onRemove?: () => void
  disabled?: boolean
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Release the object URL once it's no longer rendered.
  useEffect(() => {
    if (!preview) return
    return () => URL.revokeObjectURL(preview)
  }, [preview])

  const pick = (file?: File | null) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.')
      return
    }
    if (file.size > MAX_BYTES) {
      setError('Images must be 5 MB or smaller.')
      return
    }
    setError(null)
    setPreview(URL.createObjectURL(file))
    onSelect(file)
  }

  const busy = uploading || removing
  const dimension = size === 'xl' ? 'h-24 w-24' : 'h-16 w-16'
  // The local preview only bridges the gap until the server URL arrives.
  const previewShown = uploading ? preview : null

  return (
    <div className="flex items-center gap-4">
      <div className="relative">
        <div
          className={cn(
            'overflow-hidden',
            rounded === 'full' ? 'rounded-full' : 'rounded-2xl',
            dimension,
          )}
        >
          {previewShown ? (
            <img
              src={previewShown}
              alt="Preview"
              className="h-full w-full object-cover"
            />
          ) : (
            <Avatar
              name={name}
              seed={seed}
              src={src}
              size={size}
              className={cn(
                'h-full w-full',
                rounded === 'xl' && 'rounded-2xl',
              )}
            />
          )}
        </div>

        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || busy}
          aria-label="Change image"
          className={cn(
            'absolute inset-0 grid place-items-center bg-black/55 text-white opacity-0 transition',
            'hover:opacity-100 focus-visible:opacity-100 disabled:cursor-not-allowed',
            rounded === 'full' ? 'rounded-full' : 'rounded-2xl',
            busy && 'opacity-100',
          )}
        >
          {busy ? (
            <Loader2 size={20} className="animate-spin" />
          ) : (
            <Camera size={20} />
          )}
        </button>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          hidden
          onChange={(e) => {
            pick(e.target.files?.[0])
            e.target.value = ''
          }}
        />
      </div>

      <div className="min-w-0">
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || busy}
          >
            <Camera size={15} />
            {src ? 'Change' : 'Upload'}
          </Button>
          {src && onRemove ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onRemove}
              loading={removing}
              className="text-danger hover:bg-danger-soft hover:text-danger"
            >
              <Trash2 size={15} />
              Remove
            </Button>
          ) : null}
        </div>
        <p className="mt-1.5 text-xs text-muted">
          {error ? (
            <span className="font-medium text-danger">{error}</span>
          ) : (
            'PNG, JPG or WebP · up to 5 MB'
          )}
        </p>
      </div>
    </div>
  )
}
