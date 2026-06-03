import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'

export function TeamsListPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Teams</CardTitle>
        <Button>New team</Button>
      </CardHeader>
      <p className="text-sm text-slate-500">
        Once the backend ships <code>GET /teams/me</code> (ROADMAP Phase 3), this
        page will list teams you own or belong to.
      </p>
    </Card>
  )
}
