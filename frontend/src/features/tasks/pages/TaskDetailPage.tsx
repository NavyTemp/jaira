import { useParams } from 'react-router-dom'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>()
  return (
    <Card>
      <CardHeader>
        <CardTitle>Task {id}</CardTitle>
      </CardHeader>
      <p className="text-sm text-slate-500">
        TODO: title, description, status switcher, assignee, attachments, comments thread.
      </p>
    </Card>
  )
}
