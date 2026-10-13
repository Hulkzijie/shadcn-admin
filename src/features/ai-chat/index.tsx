import { useEffect, useState } from 'react'
import { Bot } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ChatInterface } from './components/chat-interface'
import { SessionList } from './components/session-list'
import { type AiSession } from './data/chat-types'
import {
  createConversation,
  createMessage,
  deleteConversation,
  getConversations,
  getConversationMessages,
  sendChatMessage,
} from './lib/chat-service'

export function AiChat() {
  const [sessions, setSessions] = useState<AiSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [waiting, setWaiting] = useState(false)
  const [animateAssistant, setAnimateAssistant] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null
  const activeConversationId = activeSession?.conversationId

  useEffect(() => {
    let cancelled = false
    const loadConversations = async () => {
      try {
        // 页面重新进入时从服务端恢复会话列表，避免只依赖 React 内存状态。
        const conversations = await getConversations()
        if (cancelled) return
        setSessions(
          conversations.map((conversation) => ({
            id: conversation.conversation_id,
            conversationId: conversation.conversation_id,
            sessionId: conversation.session_id,
            // 列表接口不返回 task_id；每次发送消息时由消息接口生成新的 task_id。
            taskId: '',
            title: conversation.title || 'New Chat',
            createdAt: conversation.updated_at,
            messages: [],
          }))
        )
      } catch {
        if (!cancelled) toast.error('加载历史会话失败，请稍后重试')
      }
    }
    void loadConversations()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!activeConversationId || !activeSessionId) return
    let cancelled = false
    const loadHistory = async () => {
      try {
        const messages = await getConversationMessages(activeConversationId)
        if (cancelled) return
        setSessions((prev) =>
          prev.map((session) =>
            session.id === activeSessionId ? { ...session, messages } : session
          )
        )
        // 历史消息直接展示完整内容，不使用新回答的打字机效果。
        setAnimateAssistant(false)
      } catch {
        if (!cancelled) toast.error('加载会话历史失败，请稍后重试')
      }
    }
    void loadHistory()
    return () => {
      cancelled = true
    }
  }, [activeConversationId, activeSessionId])

  const handleNewChat = async () => {
    // New Chat 先创建本地草稿，用户真正发送第一条消息时再创建服务端会话。
    const draftId = `draft-${crypto.randomUUID()}`
    setSessions((prev) => [
      ...prev,
      {
        id: draftId,
        conversationId: '',
        sessionId: '',
        taskId: '',
        title: '新会话',
        createdAt: new Date().toISOString(),
        messages: [],
      },
    ])
    setActiveSessionId(draftId)
  }

  const handleDelete = async () => {
    if (!deleteTargetId) return
    try {
      setDeleting(true)
      await deleteConversation(deleteTargetId)
      setSessions((prev) =>
        prev.filter((session) => session.id !== deleteTargetId)
      )
      if (activeSessionId === deleteTargetId) setActiveSessionId(null)
      toast.success('会话及历史消息已删除')
      setDeleteTargetId(null)
    } catch {
      toast.error('删除会话失败，请稍后重试')
    } finally {
      setDeleting(false)
    }
  }

  const handleSend = async (content: string) => {
    if (!activeSession || waiting) return

    const userMsg = createMessage('user', content)
    const updatedMessages = [...activeSession.messages, userMsg]

    setSessions((prev) =>
      prev.map((s) =>
        s.id === activeSession.id
          ? {
              ...s,
              title: s.messages.length === 0 ? content.slice(0, 30) : s.title,
              messages: updatedMessages,
            }
          : s
      )
    )
    setWaiting(true)
    // 只有本次新提问的回答才启用打字机效果。
    setAnimateAssistant(true)
    const assistantPlaceholder = createMessage('assistant', '')
    // 先插入助手占位消息，后续由 SSE 的 delta 片段持续更新内容。
    setSessions((prev) =>
      prev.map((session) =>
        session.id === activeSession.id
          ? { ...session, messages: [...updatedMessages, assistantPlaceholder] }
          : session
      )
    )

    const isDraft = !activeSession.conversationId
    let conversationId = activeSession.conversationId

    try {
      if (isDraft) {
        // 草稿首次发送时才向后端创建真实会话，避免空会话污染历史列表。
        const conversation = await createConversation(content.slice(0, 30))
        conversationId = conversation.conversation_id
      }
      await sendChatMessage(conversationId, content, (partial) => {
        setSessions((prev) =>
          prev.map((session) =>
            session.id === activeSession.id
              ? {
                  ...session,
                  messages: session.messages.map((message) =>
                    message.id === assistantPlaceholder.id
                      ? { ...message, content: partial }
                      : message
                  ),
                }
              : session
          )
        )
      })
      const messages = await getConversationMessages(conversationId)
      setSessions((prev) =>
        prev.map((s) =>
          s.id === activeSession.id
            ? {
                ...s,
                id: conversationId,
                conversationId,
                sessionId: isDraft ? conversationId : s.sessionId,
                messages,
              }
            : s
        )
      )
      if (isDraft) setActiveSessionId(conversationId)
    } catch {
      toast.error('发送消息失败，请稍后重试')
      setAnimateAssistant(false)
    } finally {
      setWaiting(false)
    }
  }

  return (
    <>
      <Header>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main fixed>
        <section className='flex h-full min-h-0 gap-6'>
          <SessionList
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelect={setActiveSessionId}
            onNewChat={handleNewChat}
            onDelete={setDeleteTargetId}
            className={cn(activeSession && 'hidden sm:flex')}
          />

          <div
            className={cn('min-w-0 flex-1', !activeSession && 'hidden sm:flex')}
          >
            {activeSession ? (
              <ChatInterface
                messages={activeSession.messages}
                waiting={waiting}
                animateAssistant={animateAssistant}
                autoFocus={activeSession.id.startsWith('draft-')}
                onSend={handleSend}
              />
            ) : (
              <div className='flex h-full w-full flex-col items-center justify-center rounded-md border bg-card shadow-xs'>
                <div className='flex flex-col items-center space-y-6'>
                  <div className='flex size-16 items-center justify-center rounded-full border-2 border-border'>
                    <Bot className='size-8' />
                  </div>
                  <div className='space-y-2 text-center'>
                    <h1 className='text-xl font-semibold'>AI Assistant</h1>
                    <p className='text-sm text-muted-foreground'>
                      Start a new chat with your AI assistant.
                    </p>
                  </div>
                  <Button onClick={handleNewChat}>Start new chat</Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </Main>

      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTargetId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该会话？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后该会话及其历史消息将无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className='bg-destructive text-white hover:bg-destructive/90'
              onClick={(event) => {
                // 等待删除接口完成后再关闭确认框，避免误以为删除成功。
                event.preventDefault()
                void handleDelete()
              }}
            >
              {deleting ? '删除中...' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
