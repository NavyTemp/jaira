import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { extractApiError } from '@/lib/apiClient'
import { authStorage } from '@/lib/authStorage'
import { usersApi } from '../api/usersApi'
import type { User } from '../types'

function ProfileForm({ user }: { user: User }) {
  const qc = useQueryClient()
  const [name, setName] = useState(user.name ?? '')
  const [age, setAge] = useState<number | ''>(
    typeof user.age === 'number' ? user.age : '',
  )
  const [gender, setGender] = useState<'male' | 'female'>(
    (user.gender as 'male' | 'female') ?? 'male',
  )
  const [phone, setPhone] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mut = useMutation({
    mutationFn: () =>
      usersApi.updateProfile({
        name,
        age: age === '' ? undefined : Number(age),
        gender,
        phone: phone || undefined,
      }),
    onSuccess: (updated) => {
      setMsg('Profile updated')
      setError(null)
      setPhone('')
      const stored = authStorage.getUser()
      if (stored) {
        authStorage.setSession({
          accessToken: authStorage.getAccessToken() ?? '',
          refreshToken: authStorage.getRefreshToken() ?? '',
          user: { ...stored, name: updated.name },
        })
      }
      qc.invalidateQueries({ queryKey: ['me'] })
    },
    onError: (err) => {
      setError(extractApiError(err))
      setMsg(null)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          mut.mutate()
        }}
      >
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="Email" value={user.email ?? ''} disabled />
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Age"
            type="number"
            value={age}
            onChange={(e) =>
              setAge(e.target.value === '' ? '' : Number(e.target.value))
            }
          />
          <label className="flex flex-col gap-1 text-sm">
            <span className="font-medium text-slate-700">Gender</span>
            <select
              className="h-10 rounded-md border border-slate-300 bg-white px-3 text-sm"
              value={gender}
              onChange={(e) => setGender(e.target.value as 'male' | 'female')}
            >
              <option value="male">male</option>
              <option value="female">female</option>
            </select>
          </label>
        </div>
        <Input
          label="Phone (leave blank to keep current)"
          placeholder="010xxxxxxxx"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />

        {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" loading={mut.isPending}>
          Save changes
        </Button>
      </form>
    </Card>
  )
}

function PasswordForm() {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const mut = useMutation({
    mutationFn: () => usersApi.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      setMsg('Password changed')
      setError(null)
      setOldPassword('')
      setNewPassword('')
    },
    onError: (err) => {
      setError(extractApiError(err))
      setMsg(null)
    },
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change password</CardTitle>
      </CardHeader>
      <form
        className="space-y-3"
        onSubmit={(e) => {
          e.preventDefault()
          mut.mutate()
        }}
      >
        <Input
          label="Current password"
          type="password"
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
        />
        <Input
          label="New password"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        {msg ? <p className="text-sm text-emerald-600">{msg}</p> : null}
        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <Button type="submit" loading={mut.isPending}>
          Update password
        </Button>
      </form>
    </Card>
  )
}

export function ProfilePage() {
  const { data: me, isLoading } = useQuery({
    queryKey: ['me'],
    queryFn: () => usersApi.me(),
  })

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {isLoading || !me ? (
        <Card>
          <p className="text-sm text-slate-500">Loading…</p>
        </Card>
      ) : (
        <ProfileForm user={me} />
      )}
      <PasswordForm />
    </div>
  )
}
