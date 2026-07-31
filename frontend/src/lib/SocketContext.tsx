import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Socket } from 'socket.io-client'
import { connectSocket, disconnectSocket, getSocket } from './socket'
import { authStorage } from './authStorage'

type SocketContextValue = {
  socket: Socket
  connected: boolean
}

const SocketContext = createContext<SocketContextValue | null>(null)

export function SocketProvider({ children }: { children: ReactNode }) {
  // Stable singleton instance for the lifetime of the app.
  const socket = useMemo(() => getSocket(), [])
  const [connected, setConnected] = useState(() => socket.connected)

  useEffect(() => {
    if (!authStorage.getAccessToken()) return

    const onConnect = () => setConnected(true)
    const onDisconnect = () => setConnected(false)

    socket.on('connect', onConnect)
    socket.on('disconnect', onDisconnect)

    connectSocket()

    return () => {
      socket.off('connect', onConnect)
      socket.off('disconnect', onDisconnect)
      disconnectSocket()
      setConnected(false)
    }
  }, [socket])

  const value = useMemo(() => ({ socket, connected }), [socket, connected])

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  )
}

/** Access the shared socket + live connection status. */
// eslint-disable-next-line react-refresh/only-export-components
export function useSocket(): SocketContextValue {
  const ctx = useContext(SocketContext)
  if (!ctx) {
    // Outside a provider (shouldn't happen in authed screens) — return a safe stub.
    return { socket: getSocket(), connected: false }
  }
  return ctx
}
