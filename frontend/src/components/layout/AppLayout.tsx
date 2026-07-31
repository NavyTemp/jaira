import { useEffect, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { SocketProvider } from '@/lib/SocketContext'
import { RealtimeBridge } from '@/components/RealtimeBridge'

const COLLAPSE_KEY = 'tms_sidebar_collapsed'

export function AppLayout() {
  const { pathname } = useLocation()
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSE_KEY) === '1',
  )
  const [mobileOpen, setMobileOpen] = useState(false)
  const [lastPath, setLastPath] = useState(pathname)

  useEffect(() => {
    localStorage.setItem(COLLAPSE_KEY, collapsed ? '1' : '0')
  }, [collapsed])

  // Never leave the drawer open across navigations (including browser back).
  if (pathname !== lastPath) {
    setLastPath(pathname)
    setMobileOpen(false)
  }

  return (
    <SocketProvider>
      <RealtimeBridge />
      <div className="flex h-screen w-full overflow-hidden bg-bg">
        <Sidebar
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((v) => !v)}
          mobileOpen={mobileOpen}
          onCloseMobile={() => setMobileOpen(false)}
        />
        <div className="flex min-w-0 flex-1 flex-col">
          <Header onOpenMobileNav={() => setMobileOpen(true)} />
          <main className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
            <div className="mx-auto w-full max-w-7xl animate-fade-in p-4 sm:p-6">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </SocketProvider>
  )
}
