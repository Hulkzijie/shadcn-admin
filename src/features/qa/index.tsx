import { useEffect, useState } from 'react'
import { MessageCircleQuestion } from 'lucide-react'
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
import { QaComposer } from './components/qa-composer'
import { QaHistory } from './components/qa-history'
import { QaThread } from './components/qa-thread'
import { VoiceCallDialog } from './components/voice-call-dialog'
import { type QaAttachment, type QaSession } from './data/qa-types'
import {
  buildPrompt,
  createConversation,
  createQaMessage,
  deleteConversation,
  getConversations,
  loadMessages,
  sendChatMessage,
} from './lib/qa-service'

export function Qa() {
  const [sessions, setSessions] = useState<QaSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [waiting, setWaiting] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null
  const deleteTarget = sessions.find((s) => s.id === deleteTargetId) ?? null

  useEffect(() => {
    let cancelled = false
    const loadConversations = async () => {
      try {
        const conversations = await getConversations()
        if (cancelled) return
        setSessions(
          conversations.map((conversation) => ({
            id: conversation.conversation_id,
            conversationId: conversation.conversation_id,
            sessionId: conversation.session_id,
            title: conversation.title || '新的问答',
            createdAt: conversation.updated_at,
            messages: [],
          }))
        )
      } catch {
        if (!cancelled) toast.error('加载对话记录失败，请稍后重试')
      }
    }
    void loadConversations()
    return () => {
      cancelled = true
    }
  }, [])

  /** 切换到某个对话时按需拉取历史消息（草稿会话无服务端历史） */
  const handleSelect = async (id: string) => {
    setActiveSessionId(id)
    const session = sessions.find((item) => item.id === id)
    if (!session || !session.conversationId || session.messages.length > 0)
      return
    try {
      const messages = await loadMessages(session.conversationId)
      setSessions((prev) =>
        prev.map((item) => (item.id === id ? { ...item, messages } : item))
      )
    } catch {
      toast.error('加载对话内容失败，请稍后重试')
    }
  }

  const handleNew = () => {
    // 新建先落在本地草稿，首条提问时才创建服务端会话
    const draftId = `draft-${crypto.randomUUID()}`
    setSessions((prev) => [
      ...prev,
      {
        id: draftId,
        conversationId: '',
        sessionId: '',
        title: '新的问答',
        createdAt: new Date().toISOString(),
        messages: [],
      },
    ])
    setActiveSessionId(draftId)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setDeleting(true)
      if (deleteTarget.conversationId) {
        await deleteConversation(deleteTarget.conversationId)
      }
      setSessions((prev) => prev.filter((s) => s.id !== deleteTarget.id))
      if (activeSessionId === deleteTarget.id) setActiveSessionId(null)
      toast.success('对话记录已删除')
      setDeleteTargetId(null)
    } catch {
      toast.error('删除对话失败，请稍后重试')
    } finally {
      setDeleting(false)
    }
  }

  /**
   * 一问一答：提问、流式接收回答、写入对话记录，并返回完整回答文本。
   * 语音通话与文字提问共用该流程。
   */
  const ask = async (
    question: string,
    attachments: QaAttachment[] = [],
    viaVoice = false
  ): Promise<string> => {
    const isDraft = !activeSession || !activeSession.conversationId
    const targetId = activeSessionId ?? `draft-${crypto.randomUUID()}`

    if (!activeSession) {
      const draft: QaSession = {
        id: targetId,
        conversationId: '',
        sessionId: '',
        title: question.slice(0, 30) || '新的问答',
        createdAt: new Date().toISOString(),
        messages: [],
      }
      setSessions((prev) => [...prev, draft])
      setActiveSessionId(targetId)
    }

    const userMessage = createQaMessage('user', question, attachments, viaVoice)
    const assistantMessage = createQaMessage('assistant', '')

    // 先乐观插入用户提问与回答占位，回答内容由流式片段持续更新
    setSessions((prev) =>
      prev.map((session) =>
        session.id === targetId
          ? {
              ...session,
              title:
                session.messages.length === 0
                  ? question.slice(0, 30) || session.title
                  : session.title,
              messages: [...session.messages, userMessage, assistantMessage],
            }
          : session
      )
    )
    setWaiting(true)

    try {
      let conversationId = activeSession?.conversationId ?? ''
      if (!conversationId) {
        const conversation = await createConversation(
          question.slice(0, 30) || '新的问答'
        )
        conversationId = conversation.conversation_id
      }

      const answer = await sendChatMessage(
        conversationId,
        buildPrompt(question, attachments),
        (partial) => {
          setSessions((prev) =>
            prev.map((session) =>
              session.id === targetId
                ? {
                    ...session,
                    messages: session.messages.map((message) =>
                      message.id === assistantMessage.id
                        ? { ...message, content: partial }
                        : message
                    ),
                  }
                : session
            )
          )
        }
      )

      setSessions((prev) =>
        prev.map((session) =>
          session.id === targetId
            ? {
                ...session,
                id: conversationId,
                conversationId,
                sessionId: conversationId,
                messages: session.messages.map((message) =>
                  message.id === assistantMessage.id
                    ? { ...message, content: answer || message.content }
                    : message
                ),
              }
            : session
        )
      )
      if (isDraft) setActiveSessionId(conversationId)
      return answer
    } catch (error) {
      // 失败时移除空回答占位，避免留下无法继续的残影
      setSessions((prev) =>
        prev.map((session) =>
          session.id === targetId
            ? {
                ...session,
                messages: session.messages.filter(
                  (message) => message.id !== assistantMessage.id
                ),
              }
            : session
        )
      )
      toast.error('提问失败，请稍后重试')
      throw error
    } finally {
      setWaiting(false)
    }
  }

  const handleSend = (content: string, attachments: QaAttachment[]) => {
    if (waiting) return
    void ask(content, attachments).catch(() => {
      // ask 内部已完成提示，这里只避免未处理的 rejection
    })
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
          <QaHistory
            sessions={sessions}
            activeSessionId={activeSessionId}
            onSelect={(id) => void handleSelect(id)}
            onNew={handleNew}
            onDelete={setDeleteTargetId}
            className={cn(activeSession && 'hidden sm:flex')}
          />

          <div
            className={cn(
              'flex min-w-0 flex-1 flex-col gap-4',
              !activeSession && 'hidden sm:flex'
            )}
          >
            {activeSession ? (
              <>
                <QaThread messages={activeSession.messages} waiting={waiting} />
                <QaComposer
                  disabled={waiting}
                  autoFocus={activeSession.id.startsWith('draft-')}
                  onSend={handleSend}
                  onOpenVoiceCall={() => setVoiceOpen(true)}
                />
              </>
            ) : (
              <div className='flex h-full w-full flex-col items-center justify-center rounded-md border bg-card shadow-xs'>
                <div className='flex flex-col items-center space-y-6'>
                  <div className='flex size-16 items-center justify-center rounded-full border-2 border-border'>
                    <MessageCircleQuestion className='size-8' />
                  </div>
                  <div className='space-y-2 text-center'>
                    <h1 className='text-xl font-semibold'>智能问答</h1>
                    <p className='text-sm text-muted-foreground'>
                      一问一答，可添加附件、语音输入或直接语音通话。
                    </p>
                  </div>
                  <Button onClick={handleNew}>开始提问</Button>
                </div>
              </div>
            )}
          </div>
        </section>
      </Main>

      <VoiceCallDialog
        open={voiceOpen}
        onOpenChange={setVoiceOpen}
        onAsk={(question) => ask(question, [], true)}
      />

      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => {
          if (!open && !deleting) setDeleteTargetId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该对话？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后该对话及其历史消息将无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={deleting}
              className='bg-destructive text-white hover:bg-destructive/90'
              onClick={(event) => {
                // 等待删除接口完成后再关闭确认框，避免误以为删除成功
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
