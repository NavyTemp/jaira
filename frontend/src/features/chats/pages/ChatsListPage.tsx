import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Card, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { authStorage } from '@/lib/authStorage'
import { formatDateTime, userId } from '@/lib/format'
import { useSocket } from '@/lib/SocketContext'
import { chatsApi } from '../api/chatsApi'
import type { Chat, Message } from '../types'

function chatTitle(chat: Chat, meId: string): string {
  if (chat.type === 'team' && typeof chat.team === 'object' && chat.team)
    return `${chat.team.name} · team`
  if (chat.type === 'task' && typeof chat.task === 'object' && chat.task)
    return `${chat.task.title} · task`
  const other = chat.participants.find((p) => p._id !== meId)
  return other ? other.name : 'Direct chat'
}

export function ChatsListPage() {
  const me = authStorage.getUser()
  const meId = me?._id ?? ''
  const [params, setParams] = useSearchParams()
  const activeId = params.get('chat')

  const { data: chats, isLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: () => chatsApi.listMine(),
  })

  const activeChat = useMemo(
    () => chats?.find((c) => c._id === activeId) ?? null,
    [chats, activeId],
  )

  return (
    <div className="grid h-[calc(100vh-6.5rem)] grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
      <Card className="flex min-h-0 flex-col">
        <CardHeader>
          <CardTitle>Chats</CardTitle>
        </CardHeader>
        <div className="min-h-0 flex-1 overflow-auto">
          {isLoading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : (chats ?? []).length === 0 ? (
            <p className="text-sm text-slate-500">
              No chats yet. Team & task chats appear here automatically.
            </p>
          ) : (
            <ul className="space-y-1">
              {(chats ?? []).map((c) => (
                <li key={c._id}>
                  <button
                    onClick={() => setParams({ chat: c._id })}
                    className={
                      'w-full rounded-md px-3 py-2 text-left text-sm transition ' +
                      (c._id === activeId
                        ? 'bg-slate-900 text-white'
                        : 'hover:bg-slate-100 text-slate-700')
                    }
                  >
                    <span className="block truncate font-medium">
                      {chatTitle(c, meId)}
                    </span>
                    <span
                      className={
                        'block truncate text-xs ' +
                        (c._id === activeId ? 'text-slate-300' : 'text-slate-400')
                      }
                    >
                      {c.lastMessage?.text || 'No messages yet'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card className="flex min-h-0 flex-col">
        {activeChat ? (
          <Conversation chat={activeChat} meId={meId} />
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-slate-400">
            Select a chat to start messaging
          </div>
        )}
      </Card>
    </div>
  )
}

function Conversation({ chat, meId }: { chat: Chat; meId: string }) {
  const { socket, connected } = useSocket()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Load history whenever the chat changes.
  useEffect(() => {
    let cancelled = false
    chatsApi.getMessages(chat._id).then((res) => {
      if (!cancelled) setMessages(res.messages)
    })
    return () => {
      cancelled = true
    }
  }, [chat._id])

  // Join the room + wire realtime listeners.
  useEffect(() => {
    if (!socket) return
    socket.emit('chat:join', chat._id)

    const onNew = (msg: Message) => {
      if (msg.chat !== chat._id) return
      setMessages((prev) =>
        prev.some((m) => m._id === msg._id) ? prev : [...prev, msg],
      )
      if (userId(msg.sender) !== meId) {
        socket.emit('message:seen', { chatId: chat._id, messageId: msg._id })
      }
    }
    const onTyping = (p: { chatId: string; userId: string; name?: string; typing: boolean }) => {
      if (p.chatId !== chat._id || p.userId === meId) return
      setTypingUser(p.typing ? p.name ?? 'Someone' : null)
    }
    const onSeen = (p: { chatId: string; messageId: string; userId: string }) => {
      if (p.chatId !== chat._id) return
      setMessages((prev) =>
        prev.map((m) =>
          m._id === p.messageId && !m.seenBy.includes(p.userId)
            ? { ...m, seenBy: [...m.seenBy, p.userId] }
            : m,
        ),
      )
    }

    socket.on('message:new', onNew)
    socket.on('message:typing', onTyping)
    socket.on('message:seen', onSeen)

    return () => {
      socket.emit('chat:leave', chat._id)
      socket.off('message:new', onNew)
      socket.off('message:typing', onTyping)
      socket.off('message:seen', onSeen)
    }
  }, [socket, chat._id, meId])

  // Auto-scroll on new messages.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, typingUser])

  const onType = () => {
    if (!socket) return
    socket.emit('message:typing', { chatId: chat._id, typing: true })
    if (typingTimeout.current) clearTimeout(typingTimeout.current)
    typingTimeout.current = setTimeout(() => {
      socket.emit('message:typing', { chatId: chat._id, typing: false })
    }, 1200)
  }

  const send = (e: FormEvent) => {
    e.preventDefault()
    const body = text.trim()
    if (!body || !socket) return
    socket.emit('message:send', { chatId: chat._id, text: body })
    socket.emit('message:typing', { chatId: chat._id, typing: false })
    setText('')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="border-b border-slate-200 pb-2">
        <p className="font-semibold text-slate-900">{chatTitle(chat, meId)}</p>
        <p className="text-xs text-slate-400">
          {chat.participants.length} participant(s)
          {connected ? '' : ' · reconnecting…'}
        </p>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-auto py-3">
        {messages.length === 0 ? (
          <p className="text-center text-sm text-slate-400">
            No messages yet — say hello.
          </p>
        ) : (
          messages.map((m) => {
            const mine = userId(m.sender) === meId
            const senderName =
              typeof m.sender === 'object' ? m.sender.name : 'You'
            return (
              <div
                key={m._id}
                className={'flex ' + (mine ? 'justify-end' : 'justify-start')}
              >
                <div
                  className={
                    'max-w-[75%] rounded-2xl px-3 py-2 text-sm ' +
                    (mine
                      ? 'bg-slate-900 text-white'
                      : 'bg-slate-100 text-slate-800')
                  }
                >
                  {!mine ? (
                    <p className="mb-0.5 text-xs font-medium text-slate-500">
                      {senderName}
                    </p>
                  ) : null}
                  <p className="whitespace-pre-wrap break-words">{m.text}</p>
                  <p
                    className={
                      'mt-1 text-right text-[10px] ' +
                      (mine ? 'text-slate-300' : 'text-slate-400')
                    }
                  >
                    {formatDateTime(m.createdAt)}
                    {mine && m.seenBy.length > 1 ? ' · seen' : ''}
                  </p>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {typingUser ? (
        <p className="px-1 pb-1 text-xs italic text-slate-400">
          {typingUser} is typing…
        </p>
      ) : null}

      <form onSubmit={send} className="flex gap-2 border-t border-slate-200 pt-3">
        <input
          className="h-10 flex-1 rounded-md border border-slate-300 bg-white px-3 text-sm"
          placeholder="Type a message…"
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            onType()
          }}
        />
        <Button type="submit" disabled={!text.trim()}>
          Send
        </Button>
      </form>
    </div>
  )
}
