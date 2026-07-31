import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  CheckCheck,
  Hash,
  ListChecks,
  MessageSquare,
  MessageSquarePlus,
  Search,
  Send,
  Users,
  X,
} from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Modal } from '@/components/ui/Modal'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { EmptyState } from '@/components/ui/EmptyState'
import { SkeletonList } from '@/components/ui/Skeleton'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/cn'
import { extractApiError } from '@/lib/apiClient'
import { authStorage } from '@/lib/authStorage'
import { formatDate, formatTime, relativeTime, userId } from '@/lib/format'
import { useSocket } from '@/lib/SocketContext'
import { teamsApi } from '@/features/teams/api/teamsApi'
import { usersApi } from '@/features/users/api/usersApi'
import { chatsApi } from '../api/chatsApi'
import type { Chat, ChatUser, Message } from '../types'

function chatTitle(chat: Chat, meId: string): string {
  if (chat.type === 'team' && typeof chat.team === 'object' && chat.team)
    return chat.team.name
  if (chat.type === 'task' && typeof chat.task === 'object' && chat.task)
    return chat.task.title
  const other = chat.participants.find((p) => p._id !== meId)
  return other?.name ?? 'Direct message'
}

function chatSubtitle(chat: Chat): string {
  if (chat.type === 'team') return 'Team channel'
  if (chat.type === 'task') return 'Task thread'
  return 'Direct message'
}

function ChatAvatar({ chat, meId }: { chat: Chat; meId: string }) {
  if (chat.type === 'team') {
    const img =
      typeof chat.team === 'object' ? chat.team?.image?.secure_url : undefined
    return (
      <Avatar
        name={chatTitle(chat, meId)}
        seed={chat._id}
        src={img}
        size="md"
        className="rounded-xl"
      />
    )
  }
  if (chat.type === 'task') {
    return (
      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-info-soft text-info-soft-fg">
        <ListChecks size={17} />
      </span>
    )
  }
  const other = chat.participants.find((p) => p._id !== meId)
  return (
    <Avatar
      name={other?.name}
      seed={other?._id}
      src={other?.image?.secure_url}
      size="md"
    />
  )
}

/** Insert a date divider whenever the day changes between messages. */
function shouldShowDate(current: Message, previous?: Message): boolean {
  if (!previous) return true
  return (
    new Date(current.createdAt).toDateString() !==
    new Date(previous.createdAt).toDateString()
  )
}

function NewDirectMessageModal({
  open,
  onClose,
  onCreated,
}: {
  open: boolean
  onClose: () => void
  onCreated: (chatId: string) => void
}) {
  const toast = useToast()
  const me = authStorage.getUser()
  const isAdmin = authStorage.getRole() === 'admin'
  const [search, setSearch] = useState('')

  // Non-admins can't list all users, so offer their teammates instead.
  const { data: teams } = useQuery({
    queryKey: ['teams'],
    queryFn: () => teamsApi.listMine(),
    enabled: open,
  })

  const { data: allUsers } = useQuery({
    queryKey: ['users', 'list'],
    queryFn: () => usersApi.list(),
    enabled: open && isAdmin,
  })

  const people = useMemo(() => {
    const map = new Map<string, ChatUser>()
    if (isAdmin && allUsers) {
      allUsers.forEach((u) => {
        if (u._id !== me?._id)
          map.set(u._id, {
            _id: u._id,
            name: u.name,
            email: u.email,
            image: u.image,
          })
      })
    }
    ;(teams ?? []).forEach((t) =>
      t.members.forEach((m) => {
        if (m.user._id !== me?._id) map.set(m.user._id, m.user)
      }),
    )
    const q = search.trim().toLowerCase()
    return [...map.values()].filter(
      (u) =>
        !q ||
        u.name.toLowerCase().includes(q) ||
        (u.email ?? '').toLowerCase().includes(q),
    )
  }, [allUsers, teams, isAdmin, me?._id, search])

  const createMut = useMutation({
    mutationFn: (uid: string) => chatsApi.getOrCreateDirect(uid),
    onSuccess: (chat) => {
      onCreated(chat._id)
      onClose()
    },
    onError: (err) => toast.error(extractApiError(err, 'Could not start chat')),
  })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New direct message"
      description="Start a private conversation with a teammate."
    >
      <div className="relative mb-4">
        <Search
          size={16}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle"
        />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search people…"
          autoFocus
          className="h-11 w-full rounded-xl border border-border bg-surface px-3.5 pl-9 text-sm text-fg placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
        />
      </div>

      {people.length === 0 ? (
        <EmptyState
          compact
          icon={<Users size={22} />}
          title="No people found"
          message="Join a team to start messaging your teammates."
        />
      ) : (
        <ul className="max-h-72 space-y-1 overflow-y-auto scrollbar-thin">
          {people.map((u) => (
            <li key={u._id}>
              <button
                onClick={() => createMut.mutate(u._id)}
                disabled={createMut.isPending}
                className="flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition hover:bg-surface-2 disabled:opacity-50"
              >
                <Avatar
                  name={u.name}
                  seed={u._id}
                  src={u.image?.secure_url}
                  size="sm"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-fg">
                    {u.name}
                  </span>
                  {u.email ? (
                    <span className="block truncate text-xs text-muted">
                      {u.email}
                    </span>
                  ) : null}
                </span>
                <MessageSquare size={15} className="shrink-0 text-subtle" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Modal>
  )
}

export function ChatsListPage() {
  const me = authStorage.getUser()
  const meId = me?._id ?? ''
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()
  const activeId = params.get('chat')

  const [search, setSearch] = useState('')
  const [newOpen, setNewOpen] = useState(false)

  const { data: chats, isLoading } = useQuery({
    queryKey: ['chats'],
    queryFn: () => chatsApi.listMine(),
  })

  const activeChat = useMemo(
    () => chats?.find((c) => c._id === activeId) ?? null,
    [chats, activeId],
  )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return chats ?? []
    return (chats ?? []).filter((c) =>
      chatTitle(c, meId).toLowerCase().includes(q),
    )
  }, [chats, search, meId])

  const openChat = (id: string) => setParams({ chat: id })

  return (
    <div className="grid h-[calc(100vh-7rem)] min-h-96 grid-cols-1 gap-4 md:grid-cols-[20rem_1fr]">
      {/* ── Conversation list ── */}
      <Card
        padded={false}
        className={cn(
          'flex min-h-0 flex-col overflow-hidden',
          activeChat && 'hidden md:flex',
        )}
      >
        <div className="border-b border-border p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <h1 className="font-semibold tracking-tight text-fg">Messages</h1>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={() => setNewOpen(true)}
              aria-label="New direct message"
              title="New direct message"
            >
              <MessageSquarePlus size={17} />
            </Button>
          </div>
          <div className="relative">
            <Search
              size={15}
              className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-subtle"
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search conversations…"
              aria-label="Search conversations"
              className="h-9 w-full rounded-xl border border-border bg-surface-2 pl-8 pr-8 text-sm text-fg placeholder:text-subtle focus:border-brand focus:bg-surface focus:outline-none focus:ring-4 focus:ring-brand/15"
            />
            {search ? (
              <button
                onClick={() => setSearch('')}
                aria-label="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-subtle hover:text-fg"
              >
                <X size={13} />
              </button>
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-2 scrollbar-thin">
          {isLoading ? (
            <div className="px-2">
              <SkeletonList rows={5} />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              compact
              icon={<MessageSquare size={22} />}
              title={search ? 'No matches' : 'No conversations'}
              message={
                search
                  ? 'Try a different name.'
                  : 'Team and task chats appear here automatically.'
              }
              action={
                !search ? (
                  <Button size="sm" variant="outline" onClick={() => setNewOpen(true)}>
                    <MessageSquarePlus size={15} />
                    New message
                  </Button>
                ) : null
              }
            />
          ) : (
            <ul className="space-y-0.5">
              {filtered.map((c) => {
                const active = c._id === activeId
                const unseen =
                  !!c.lastMessage &&
                  userId(c.lastMessage.sender) !== meId &&
                  !c.lastMessage.seenBy.includes(meId)

                return (
                  <li key={c._id}>
                    <button
                      onClick={() => openChat(c._id)}
                      className={cn(
                        'flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition',
                        active ? 'bg-brand-soft' : 'hover:bg-surface-2',
                      )}
                    >
                      <ChatAvatar chat={c} meId={meId} />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              'truncate text-sm font-semibold',
                              active ? 'text-brand-soft-fg' : 'text-fg',
                            )}
                          >
                            {chatTitle(c, meId)}
                          </span>
                          {c.lastMessage ? (
                            <span className="shrink-0 text-[11px] text-subtle">
                              {relativeTime(c.lastMessage.createdAt)}
                            </span>
                          ) : null}
                        </span>
                        <span className="mt-0.5 flex items-center justify-between gap-2">
                          <span
                            className={cn(
                              'truncate text-xs',
                              unseen ? 'font-semibold text-fg' : 'text-muted',
                            )}
                          >
                            {c.lastMessage?.text || 'No messages yet'}
                          </span>
                          {unseen ? (
                            <span className="h-2 w-2 shrink-0 rounded-full bg-brand" />
                          ) : null}
                        </span>
                      </span>
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </Card>

      {/* ── Conversation ── */}
      <Card
        padded={false}
        className={cn(
          'flex min-h-0 flex-col overflow-hidden',
          !activeChat && 'hidden md:flex',
        )}
      >
        {activeChat ? (
          <Conversation
            key={activeChat._id}
            chat={activeChat}
            meId={meId}
            onBack={() => setParams({})}
            onActivity={() => qc.invalidateQueries({ queryKey: ['chats'] })}
          />
        ) : (
          <EmptyState
            icon={<MessageSquare size={24} />}
            title="Select a conversation"
            message="Choose a chat from the list, or start a new direct message."
            action={
              <Button variant="outline" onClick={() => setNewOpen(true)}>
                <MessageSquarePlus size={15} />
                New message
              </Button>
            }
            className="flex-1"
          />
        )}
      </Card>

      <NewDirectMessageModal
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreated={(id) => {
          qc.invalidateQueries({ queryKey: ['chats'] })
          openChat(id)
        }}
      />
    </div>
  )
}

function Conversation({
  chat,
  meId,
  onBack,
  onActivity,
}: {
  chat: Chat
  meId: string
  onBack: () => void
  onActivity: () => void
}) {
  const { socket, connected } = useSocket()
  const [messages, setMessages] = useState<Message[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [typingUser, setTypingUser] = useState<string | null>(null)
  const bottomRef = useRef<HTMLDivElement | null>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  // This component is keyed by chat id, so mounting once per chat is enough.
  useEffect(() => {
    let cancelled = false
    chatsApi
      .getMessages(chat._id)
      .then((res) => {
        if (!cancelled) setMessages(res.messages)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
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
      onActivity()
      if (userId(msg.sender) !== meId) {
        socket.emit('message:seen', { chatId: chat._id, messageId: msg._id })
      }
    }
    const onTyping = (p: {
      chatId: string
      userId: string
      name?: string
      typing: boolean
    }) => {
      if (p.chatId !== chat._id || p.userId === meId) return
      setTypingUser(p.typing ? (p.name ?? 'Someone') : null)
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
  }, [socket, chat._id, meId, onActivity])

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
      {/* ── Header ── */}
      <div className="flex items-center gap-3 border-b border-border px-3.5 py-3">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          className="md:hidden"
          aria-label="Back to conversations"
        >
          <ArrowLeft size={17} />
        </Button>
        <ChatAvatar chat={chat} meId={meId} />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold text-fg">
            {chatTitle(chat, meId)}
          </p>
          <p className="flex items-center gap-1.5 text-xs text-muted">
            <Hash size={11} />
            {chatSubtitle(chat)} · {chat.participants.length}{' '}
            {chat.participants.length === 1 ? 'participant' : 'participants'}
          </p>
        </div>
        {!connected ? (
          <Badge tone="warning">Reconnecting…</Badge>
        ) : (
          <Badge tone="success">Live</Badge>
        )}
      </div>

      {/* ── Messages ── */}
      <div className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3.5 py-4 scrollbar-thin">
        {loading ? (
          <div className="space-y-3">
            <SkeletonList rows={4} />
          </div>
        ) : messages.length === 0 ? (
          <EmptyState
            icon={<MessageSquare size={22} />}
            title="No messages yet"
            message="Say hello to get the conversation started."
          />
        ) : (
          messages.map((m, i) => {
            const mine = userId(m.sender) === meId
            const previous = messages[i - 1]
            const senderName =
              typeof m.sender === 'object' ? m.sender.name : 'Unknown'
            const senderImage =
              typeof m.sender === 'object' ? m.sender.image?.secure_url : undefined
            // Group consecutive messages from the same person.
            const grouped =
              !!previous &&
              userId(previous.sender) === userId(m.sender) &&
              !shouldShowDate(m, previous)

            return (
              <div key={m._id}>
                {shouldShowDate(m, previous) ? (
                  <div className="my-4 flex items-center gap-3">
                    <span className="h-px flex-1 bg-border" />
                    <span className="text-[11px] font-semibold uppercase tracking-wide text-subtle">
                      {formatDate(m.createdAt)}
                    </span>
                    <span className="h-px flex-1 bg-border" />
                  </div>
                ) : null}

                <div
                  className={cn(
                    'flex items-end gap-2',
                    mine ? 'justify-end' : 'justify-start',
                    grouped ? 'mt-0.5' : 'mt-3',
                  )}
                >
                  {!mine ? (
                    grouped ? (
                      <span className="w-7 shrink-0" />
                    ) : (
                      <Avatar
                        name={senderName}
                        seed={userId(m.sender)}
                        src={senderImage}
                        size="xs"
                        className="mb-1 h-7 w-7"
                      />
                    )
                  ) : null}

                  <div
                    className={cn(
                      'max-w-[78%] px-3.5 py-2 text-sm shadow-sm',
                      mine
                        ? 'rounded-2xl rounded-br-md bg-brand text-brand-fg'
                        : 'rounded-2xl rounded-bl-md border border-border bg-surface-2 text-fg',
                    )}
                  >
                    {!mine && !grouped ? (
                      <p className="mb-0.5 text-xs font-semibold text-brand">
                        {senderName}
                      </p>
                    ) : null}

                    <p className="whitespace-pre-wrap break-words leading-relaxed">
                      {m.text}
                    </p>

                    <p
                      className={cn(
                        'mt-1 flex items-center justify-end gap-1 text-[10px]',
                        mine ? 'text-brand-fg/70' : 'text-subtle',
                      )}
                    >
                      {formatTime(m.createdAt)}
                      {mine && m.seenBy.length > 1 ? (
                        <CheckCheck size={12} />
                      ) : null}
                    </p>
                  </div>
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* ── Composer ── */}
      <div className="border-t border-border px-3.5 py-3">
        {typingUser ? (
          <p className="mb-1.5 flex items-center gap-1.5 text-xs text-muted">
            <span className="flex gap-0.5">
              {[0, 150, 300].map((delay) => (
                <span
                  key={delay}
                  className="h-1.5 w-1.5 animate-bounce rounded-full bg-subtle"
                  style={{ animationDelay: `${delay}ms` }}
                />
              ))}
            </span>
            {typingUser} is typing…
          </p>
        ) : null}

        <form onSubmit={send} className="flex items-end gap-2">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value)
              onType()
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                send(e)
              }
            }}
            rows={1}
            placeholder="Type a message…  (Shift + Enter for a new line)"
            aria-label="Message"
            className="max-h-32 min-h-11 flex-1 resize-none rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-fg placeholder:text-subtle focus:border-brand focus:outline-none focus:ring-4 focus:ring-brand/15"
          />
          <Button type="submit" size="icon" disabled={!text.trim()} aria-label="Send">
            <Send size={16} />
          </Button>
        </form>
      </div>
    </div>
  )
}
