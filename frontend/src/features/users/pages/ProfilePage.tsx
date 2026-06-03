import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { authStorage } from '@/lib/authStorage'

export function ProfilePage() {
  const user = authStorage.getUser()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile</CardTitle>
      </CardHeader>
      {user ? (
        <dl className="grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-slate-500">Name</dt>
          <dd className="text-slate-900">{user.name}</dd>
          <dt className="text-slate-500">Email</dt>
          <dd className="text-slate-900">{user.email}</dd>
          <dt className="text-slate-500">Role</dt>
          <dd className="text-slate-900">{user.role}</dd>
        </dl>
      ) : (
        <p className="text-sm text-slate-500">No user data.</p>
      )}
      <p className="mt-4 text-xs text-slate-400">
        TODO: profile-edit form wired to <code>usersApi.updateProfile</code>.
      </p>
    </Card>
  )
}
