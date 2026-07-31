import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  BadgeCheck,
  Check,
  Copy,
  KeyRound,
  Mail,
  ShieldAlert,
  Trash2,
  UserCircle,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, PageHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Select } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { ImagePicker } from '@/components/ui/ImagePicker'
import { ConfirmDialog } from '@/components/ui/Modal'
import { ErrorState } from '@/components/ui/EmptyState'
import { Skeleton } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { extractApiError } from '@/lib/apiClient'
import { authStorage } from '@/lib/authStorage'
import { formatDate } from '@/lib/format'
import { usersApi } from '../api/usersApi'
import type { User } from '../types'

function syncStoredName(name: string) {
  const stored = authStorage.getUser()
  if (!stored) return
  authStorage.setSession({
    accessToken: authStorage.getAccessToken() ?? '',
    refreshToken: authStorage.getRefreshToken() ?? '',
    user: { ...stored, name },
  })
}

function IdentityCard({ user }: { user: User }) {
  const qc = useQueryClient()
  const toast = useToast()
  const [copied, setCopied] = useState(false)

  const avatarMut = useMutation({
    mutationFn: (file: File) =>
      usersApi.setAvatar(file, !!user.image?.public_id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
      toast.success('Profile photo updated')
    },
    onError: (err) => toast.error(extractApiError(err, 'Could not upload photo')),
  })

  const removeAvatarMut = useMutation({
    mutationFn: () => usersApi.removeAvatar(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['me'] })
      toast.success('Profile photo removed')
    },
    onError: (err) => toast.error(extractApiError(err, 'Could not remove photo')),
  })

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(user._id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Could not copy to clipboard')
    }
  }

  return (
    <Card>
      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <ImagePicker
          name={user.name}
          seed={user._id}
          src={user.image?.secure_url}
          uploading={avatarMut.isPending}
          removing={removeAvatarMut.isPending}
          onSelect={(file) => avatarMut.mutate(file)}
          onRemove={() => removeAvatarMut.mutate()}
        />
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold tracking-tight text-fg">
            {user.name}
          </h2>
          <Badge tone={user.role === 'admin' ? 'brand' : 'neutral'} className="capitalize">
            {user.role}
          </Badge>
          {user.confirm ? (
            <Badge tone="success">
              <BadgeCheck size={11} />
              Verified
            </Badge>
          ) : (
            <Badge tone="warning">Unverified</Badge>
          )}
        </div>
        <p className="mt-1 text-sm text-muted">{user.email}</p>
        <p className="mt-0.5 text-xs text-subtle">
          Member since {formatDate(user.createdAt)}
        </p>

        <div className="mt-4 rounded-xl border border-border bg-surface-2 p-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-subtle">
            Your user ID
          </p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-surface px-2.5 py-1.5 font-mono text-xs text-fg">
              {user._id}
            </code>
            <Button variant="outline" size="sm" onClick={copyId}>
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted">
            Share this with a team owner so they can add you to their team.
          </p>
        </div>
      </div>
    </Card>
  )
}

function DetailsForm({ user }: { user: User }) {
  const qc = useQueryClient()
  const toast = useToast()

  const [name, setName] = useState(user.name ?? '')
  const [age, setAge] = useState<number | ''>(
    typeof user.age === 'number' ? user.age : '',
  )
  const [gender, setGender] = useState<'male' | 'female'>(user.gender ?? 'male')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mut = useMutation({
    mutationFn: () =>
      usersApi.updateProfile({
        name: name.trim(),
        age: age === '' ? undefined : Number(age),
        gender,
        phone: phone || undefined,
      }),
    onSuccess: (updated) => {
      setError(null)
      setPhone('')
      syncStoredName(updated.name)
      qc.invalidateQueries({ queryKey: ['me'] })
      toast.success('Profile updated')
    },
    onError: (err) => setError(extractApiError(err, 'Could not update profile')),
  })

  return (
    <Card>
      <CardHeader className="mb-5">
        <div>
          <CardTitle>Personal details</CardTitle>
          <p className="mt-0.5 text-sm text-muted">
            This is how you appear to your teammates.
          </p>
        </div>
      </CardHeader>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          setError(null)
          mut.mutate()
        }}
      >
        <Input
          label="Full name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Age"
            type="number"
            min={1}
            value={age}
            onChange={(e) =>
              setAge(e.target.value === '' ? '' : Number(e.target.value))
            }
          />
          <Select
            label="Gender"
            value={gender}
            onChange={(e) => setGender(e.target.value as 'male' | 'female')}
          >
            <option value="male">Male</option>
            <option value="female">Female</option>
          </Select>
        </div>
        <Input
          label="Phone"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="010xxxxxxxx"
          hint="Stored encrypted. Leave blank to keep your current number."
        />

        {error ? <ErrorState message={error} /> : null}

        <div className="flex justify-end">
          <Button type="submit" loading={mut.isPending}>
            Save changes
          </Button>
        </div>
      </form>
    </Card>
  )
}

function EmailForm({ currentEmail }: { currentEmail: string }) {
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mut = useMutation({
    mutationFn: () => usersApi.updateEmail(email.trim()),
    onSuccess: () => {
      setError(null)
      setEmail('')
      toast.success('Check your inbox to confirm the new address')
    },
    onError: (err) => setError(extractApiError(err, 'Could not update email')),
  })

  return (
    <Card>
      <CardHeader className="mb-5">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Mail size={16} className="text-subtle" />
            Email address
          </CardTitle>
          <p className="mt-0.5 text-sm text-muted">
            Currently <span className="font-medium text-fg">{currentEmail}</span>
          </p>
        </div>
      </CardHeader>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          setError(null)
          mut.mutate()
        }}
      >
        <Input
          label="New email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@company.com"
          required
        />
        {error ? <ErrorState message={error} /> : null}
        <div className="flex justify-end">
          <Button
            type="submit"
            variant="outline"
            loading={mut.isPending}
            disabled={!email.trim()}
          >
            Update email
          </Button>
        </div>
      </form>
    </Card>
  )
}

function PasswordForm() {
  const toast = useToast()
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  const mismatch = !!confirmPassword && newPassword !== confirmPassword

  const mut = useMutation({
    mutationFn: () => usersApi.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      setError(null)
      setOldPassword('')
      setNewPassword('')
      setConfirmPassword('')
      toast.success('Password changed')
    },
    onError: (err) => setError(extractApiError(err, 'Could not change password')),
  })

  return (
    <Card>
      <CardHeader className="mb-5">
        <div>
          <CardTitle className="flex items-center gap-2">
            <KeyRound size={16} className="text-subtle" />
            Password
          </CardTitle>
          <p className="mt-0.5 text-sm text-muted">
            Use at least 8 characters with a mix of letters and numbers.
          </p>
        </div>
      </CardHeader>

      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          setError(null)
          if (!mismatch) mut.mutate()
        }}
      >
        <Input
          label="Current password"
          type="password"
          autoComplete="current-password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          required
        />
        <Input
          label="New password"
          type="password"
          autoComplete="new-password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          required
        />
        <Input
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={mismatch ? 'Passwords do not match' : undefined}
          required
        />

        {error ? <ErrorState message={error} /> : null}

        <div className="flex justify-end">
          <Button
            type="submit"
            variant="outline"
            loading={mut.isPending}
            disabled={!oldPassword || !newPassword || mismatch}
          >
            Update password
          </Button>
        </div>
      </form>
    </Card>
  )
}

function DangerZone() {
  const navigate = useNavigate()
  const toast = useToast()
  const [open, setOpen] = useState(false)

  const mut = useMutation({
    mutationFn: () => usersApi.deleteSelf(),
    onSuccess: () => {
      authStorage.clear()
      toast.success('Account deleted')
      navigate('/login', { replace: true })
    },
    onError: (err) => toast.error(extractApiError(err, 'Could not delete account')),
  })

  return (
    <Card className="border-danger/25">
      <CardHeader className="mb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-danger">
            <ShieldAlert size={16} />
            Danger zone
          </CardTitle>
          <p className="mt-0.5 text-sm text-muted">
            Deleting your account removes your access immediately.
          </p>
        </div>
      </CardHeader>

      <Button variant="danger" onClick={() => setOpen(true)}>
        <Trash2 size={15} />
        Delete my account
      </Button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() => mut.mutate()}
        loading={mut.isPending}
        title="Delete your account?"
        message="You'll be signed out and lose access to your tasks and teams. This cannot be undone from the app."
        confirmLabel="Delete account"
      />
    </Card>
  )
}

export function ProfilePage() {
  const { data: me, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.me(),
  })

  return (
    <div>
      <PageHeader
        title="Profile & settings"
        description="Manage your identity, security and account."
        icon={<UserCircle size={19} />}
      />

      {isError ? (
        <ErrorState
          message={extractApiError(error, 'Could not load your profile')}
          onRetry={() => void refetch()}
        />
      ) : isLoading || !me ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="space-y-4">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-11 w-full" />
              <Skeleton className="h-11 w-full" />
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <IdentityCard user={me} />
            <EmailForm currentEmail={me.email} />
          </div>
          <div className="space-y-4">
            <DetailsForm user={me} />
            <PasswordForm />
            <DangerZone />
          </div>
        </div>
      )}
    </div>
  )
}
