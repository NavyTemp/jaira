import { Card, CardHeader, CardTitle } from '@/components/ui/Card'

export function NotificationsPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
      </CardHeader>
      <p className="text-sm text-slate-500">
        Backend notifications routes are planned in ROADMAP Phase 8.
      </p>
    </Card>
  )
}
