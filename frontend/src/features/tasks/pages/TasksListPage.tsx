import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function TasksListPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>My Tasks</CardTitle>
        <Button>New task</Button>
      </CardHeader>
      <p className="text-sm text-slate-500">
        Backend route <code>GET /tasks</code> is planned in ROADMAP Phase 4. Wire
        <code> tasksApi.list()</code> to <code>useQuery</code> here once it lands.
      </p>
    </Card>
  )
}
