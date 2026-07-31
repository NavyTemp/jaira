import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useSocket } from '@/lib/SocketContext'
import { useToast } from '@/components/ui/Toast'
import type { Notification } from '@/features/notifications/types'

/**
 * Central place where server-pushed socket events update the react-query cache
 * and surface toasts. Individual pages can still add finer-grained listeners.
 */
export function RealtimeBridge() {
  const { socket } = useSocket()
  const qc = useQueryClient()
  const { toast } = useToast()

  useEffect(() => {
    if (!socket) return

    const onNotification = (n: Notification) => {
      qc.invalidateQueries({ queryKey: ['notifications'] })
      toast(n?.message ?? 'New notification', 'info')
    }
    const onChatMessage = () => {
      qc.invalidateQueries({ queryKey: ['chats'] })
    }
    const onTaskChange = (payload: { taskId?: string }) => {
      qc.invalidateQueries({ queryKey: ['tasks'] })
      if (payload?.taskId) {
        qc.invalidateQueries({ queryKey: ['task', payload.taskId] })
      }
    }

    socket.on('notification:new', onNotification)
    socket.on('chat:message', onChatMessage)
    socket.on('task:updated', onTaskChange)
    socket.on('task:deleted', onTaskChange)

    return () => {
      socket.off('notification:new', onNotification)
      socket.off('chat:message', onChatMessage)
      socket.off('task:updated', onTaskChange)
      socket.off('task:deleted', onTaskChange)
    }
  }, [socket, qc, toast])

  return null
}
