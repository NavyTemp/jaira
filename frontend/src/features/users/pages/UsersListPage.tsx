import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { extractApiError } from '@/lib/apiClient'
import { usersApi } from '../api/usersApi'

export function UsersListPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: () => usersApi.list(),
  })

  return (
    <Card>
      <CardHeader>
        <CardTitle>Users (admin)</CardTitle>
      </CardHeader>

      {isLoading ? <p className="text-sm text-slate-500">Loading…</p> : null}
      {error ? (
        <p className="text-sm text-red-600">{extractApiError(error)}</p>
      ) : null}

      {data && data.length > 0 ? (
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 text-slate-500">
            <tr>
              <th className="py-2">Name</th>
              <th className="py-2">Email</th>
              <th className="py-2">Role</th>
              <th className="py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.map((u) => (
              <tr key={u._id} className="border-b border-slate-100">
                <td className="py-2">{u.name}</td>
                <td className="py-2">{u.email}</td>
                <td className="py-2">{u.role}</td>
                <td className="py-2">{u.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}

      {data && data.length === 0 ? (
        <p className="text-sm text-slate-500">No users found.</p>
      ) : null}
    </Card>
  )
}
