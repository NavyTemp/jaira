import { Card, CardHeader, CardTitle } from '@/components/ui/Card'

export function ChatsListPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Chats</CardTitle>
      </CardHeader>
      <p className="text-sm text-slate-500">
        Backend chat routes are planned in ROADMAP Phase 9. The real-time layer
        (Socket.IO) follows in Phase 10.
      </p>
    </Card>
  )
}
