import { useParams } from 'react-router-dom'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'

export function TeamDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team {id}</CardTitle>
      </CardHeader>
      <p className="text-sm text-slate-500">
        TODO: members table, tasks panel, team chat link.
      </p>
    </Card>
  )
}
