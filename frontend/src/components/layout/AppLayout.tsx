import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { SocketProvider } from '@/lib/SocketContext'
import { RealtimeBridge } from '@/components/RealtimeBridge'

export function AppLayout() {
  return (
    <SocketProvider>
      <RealtimeBridge />
      <div className="flex h-screen w-screen bg-slate-50">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header />
          <main className="min-h-0 flex-1 overflow-auto p-6">
            <Outlet />
          </main>
        </div>
      </div>
    </SocketProvider>
  )
}
