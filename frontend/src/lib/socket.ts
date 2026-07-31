import { io } from 'socket.io-client'
import type { Socket } from 'socket.io-client'
import { authStorage } from './authStorage'

/**
 * Resolve the Socket.IO origin.
 *  - dev: undefined -> same origin; Vite proxies `/socket.io` to the backend.
 *  - prod: set VITE_SOCKET_URL (or reuse VITE_API_URL if it's a full origin).
 */
function resolveUrl(): string | undefined {
  const explicit = import.meta.env.VITE_SOCKET_URL as string | undefined
  if (explicit) return explicit
  const api = import.meta.env.VITE_API_URL as string | undefined
  if (api && /^https?:\/\//.test(api)) return api.replace(/\/$/, '')
  return undefined
}

let socket: Socket | null = null

/** Lazily create the shared singleton socket (does not auto-connect). */
export function getSocket(): Socket {
  if (socket) return socket
  const url = resolveUrl()
  const options = {
    autoConnect: false,
    auth: { token: authStorage.getAccessToken() ?? '' },
  }
  socket = url ? io(url, options) : io(options)
  return socket
}

/** (Re)connect with the freshest token. Safe to call repeatedly. */
export function connectSocket(): Socket {
  const s = getSocket()
  s.auth = { token: authStorage.getAccessToken() ?? '' }
  if (!s.connected) s.connect()
  return s
}

/** Disconnect but keep the instance so it can cleanly reconnect later. */
export function disconnectSocket(): void {
  socket?.disconnect()
}
