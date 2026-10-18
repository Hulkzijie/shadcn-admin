import {
  useEffect,
  useRef,
  useState,
  type RefObject,
  type SubmitEvent,
} from 'react'
import { Link } from '@tanstack/react-router'
import {
  ArrowLeft,
  ArrowUp,
  ArrowUpRight,
  Bot,
  Check,
  Copy,
  History,
  MessageSquare,
  Plus,
  Sparkles,
  Workflow,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { Textarea } from '@/components/ui/textarea'
import { ConfigDrawer } from '@/components/config-drawer'
import { ThemeSwitch } from '@/components/theme-switch'

const timeFormatter = new Intl.DateTimeFormat('zh-CN', {
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
})

const messageTimeFormatter = new Intl.DateTimeFormat('zh-CN', {
  hour: '2-digit',
  minute: '2-digit',
})

const SUGGESTIONS = [
  '帮我总结这周的待办事项',
  '把这个需求拆成可执行的开发任务',
  '解释一下这段代码的作用',
  '给新同事一份上手指南',
] as const

/** 占位回答：接入模型后替换为真实结果。 */
const PLACEHOLDER_ANSWER =
  '这是占位回答。接入模型后，这里会返回结论、依据，以及可以直接执行的下一步建议。'

type ChatMessage = {
  id: string
  role: 'user' | 'assistant'
  content: string
  createdAt: Date
}

type Conversation = {
  id: string
  title: string
  messages: ChatMessage[]
  updatedAt: Date
}

type AgentComposerProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: () => void
  textareaRef: RefObject<HTMLTextAreaElement | null>
}

function AgentComposer({
  value,
  onChange,
  onSubmit,
  textareaRef,
}: AgentComposerProps) {
  const canSubmit = value.trim().length > 0

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    onSubmit()
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='rounded-2xl border bg-card p-3 shadow-xs transition-[border-color,box-shadow] focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/30'
    >
      <Textarea
        ref={textareaRef}
        name='question'
        autoComplete='off'
        aria-label='向 Agent 提问'
        placeholder='比如：帮我总结这周的待办事项…'
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          // 中文输入法组词时按 Enter 只用于确认候选词，不应发送
          if (event.key === 'Enter' && !event.shiftKey) {
            if (event.nativeEvent.isComposing) return
            event.preventDefault()
            onSubmit()
          }
        }}
        className='field-sizing-content max-h-48 min-h-12 resize-none border-0 bg-transparent px-1 py-1 shadow-none focus-visible:border-0 focus-visible:ring-0 dark:bg-transparent'
      />
      <div className='mt-1 flex items-center justify-between gap-3 px-1'>
        <p className='hidden text-xs text-muted-foreground sm:block'>
          Enter 发送，Shift&nbsp;+&nbsp;Enter 换行
        </p>
        <Button
          type='submit'
          size='icon'
          aria-label='发送问题'
          disabled={!canSubmit}
          className='ms-auto rounded-full'
        >
          <ArrowUp aria-hidden='true' />
        </Button>
      </div>
    </form>
  )
}

type ConversationButtonProps = {
  conversation: Conversation
  active: boolean
  onSelect: () => void
}

function ConversationButton({
  conversation,
  active,
  onSelect,
}: ConversationButtonProps) {
  const lastQuestion = [...conversation.messages]
    .reverse()
    .find((message) => message.role === 'user')

  return (
    <button
      type='button'
      onClick={onSelect}
      aria-current={active ? 'true' : undefined}
      className={cn(
        'flex w-full flex-col gap-1 rounded-lg px-3 py-2.5 text-start transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
        active && 'bg-accent'
      )}
    >
      <span className='flex w-full items-baseline gap-2'>
        <span className='min-w-0 flex-1 truncate text-sm font-medium'>
          {conversation.title}
        </span>
        <time
          dateTime={conversation.updatedAt.toISOString()}
          className='shrink-0 text-xs text-muted-foreground tabular-nums'
        >
          {timeFormatter.format(conversation.updatedAt)}
        </time>
      </span>
      <span className='w-full truncate text-xs text-muted-foreground'>
        {lastQuestion?.content ?? '暂无提问'}
      </span>
    </button>
  )
}

export function AgentHome() {
  const [input, setInput] = useState('')
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const inputRef = useRef<HTMLTextAreaElement>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const copyTimerRef = useRef<number | null>(null)
  const previousActiveIdRef = useRef<string | null>(null)

  const active = conversations.find((item) => item.id === activeId) ?? null
  const orderedConversations = [...conversations].sort(
    (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
  )
  const messageCount = active?.messages.length ?? 0

  /** 新对话或切换对话后，把焦点交还给输入框，方便直接追问。 */
  useEffect(() => {
    if (previousActiveIdRef.current === activeId) return
    previousActiveIdRef.current = activeId
    if (!window.matchMedia('(pointer: fine)').matches) return
    inputRef.current?.focus()
  }, [activeId])

  /** 新消息或切换对话后滚动到底部。 */
  useEffect(() => {
    const node = scrollRef.current
    if (!node) return
    const reduceMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches
    node.scrollTo({
      top: node.scrollHeight,
      behavior: reduceMotion ? 'auto' : 'smooth',
    })
  }, [activeId, messageCount])

  useEffect(
    () => () => {
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
    },
    []
  )

  const ask = (question: string) => {
    const trimmed = question.trim()
    if (!trimmed) return

    const now = new Date()
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content: trimmed,
      createdAt: now,
    }
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: PLACEHOLDER_ANSWER,
      createdAt: now,
    }

    if (active) {
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === active.id
            ? {
                ...conversation,
                messages: [
                  ...conversation.messages,
                  userMessage,
                  assistantMessage,
                ],
                updatedAt: now,
              }
            : conversation
        )
      )
    } else {
      const conversation: Conversation = {
        id: crypto.randomUUID(),
        title: trimmed.slice(0, 30),
        messages: [userMessage, assistantMessage],
        updatedAt: now,
      }
      setConversations((prev) => [conversation, ...prev])
      setActiveId(conversation.id)
    }

    setInput('')
  }

  const startNew = () => {
    setActiveId(null)
    setInput('')
  }

  const copyMessage = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.content)
      setCopiedId(message.id)
      if (copyTimerRef.current) window.clearTimeout(copyTimerRef.current)
      copyTimerRef.current = window.setTimeout(() => setCopiedId(null), 1600)
    } catch {
      toast.error('复制失败，请手动选择文本复制')
    }
  }

  return (
    <div className='flex h-svh w-full min-w-0 touch-manipulation flex-col overflow-hidden bg-background'>
      <a
        href='#agent-main'
        className='sr-only focus:not-sr-only focus:fixed focus:inset-s-3 focus:top-3 focus:z-50 focus:rounded-md focus:bg-background focus:px-3 focus:py-2 focus:text-sm focus:ring-2 focus:ring-ring'
      >
        跳到主要内容
      </a>

      <header className='flex h-14 shrink-0 items-center gap-2 border-b bg-background px-2 sm:px-4'>
        <Button
          asChild
          size='icon'
          variant='ghost'
          aria-label='返回首页'
          className='rounded-full'
        >
          <Link to='/'>
            <ArrowLeft aria-hidden='true' />
          </Link>
        </Button>
        <span className='flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
          <Bot className='size-4' aria-hidden='true' />
        </span>
        <div className='min-w-0 flex-1'>
          <h1 className='truncate text-sm font-semibold'>Agent 问答</h1>
          <p className='truncate text-xs text-muted-foreground'>
            {active ? active.title : '智能助手'}
          </p>
        </div>
        <div className='flex shrink-0 items-center gap-1'>
          <Button asChild variant='ghost' size='sm' className='px-2 sm:px-3'>
            <Link to='/agents' aria-label='打开智能体列表'>
              <Workflow className='size-4' aria-hidden='true' />
              <span className='hidden sm:inline'>编排</span>
            </Link>
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            aria-label='开始新对话'
            onClick={startNew}
            className='px-2 sm:px-3 lg:hidden'
          >
            <Plus className='size-4' aria-hidden='true' />
            <span className='hidden sm:inline'>新对话</span>
          </Button>
          <Button
            type='button'
            variant='ghost'
            size='sm'
            aria-label='查看历史对话'
            onClick={() => setHistoryOpen(true)}
            className='px-2 sm:px-3 lg:hidden'
          >
            <History className='size-4' aria-hidden='true' />
            <span className='hidden sm:inline'>历史</span>
            {conversations.length > 0 && (
              <span className='inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-muted px-1 text-[11px] font-medium tabular-nums'>
                {conversations.length}
              </span>
            )}
          </Button>
          <div className='ms-1 hidden items-center gap-1 sm:flex'>
            <ThemeSwitch />
            <ConfigDrawer />
          </div>
        </div>
      </header>

      <div className='flex min-h-0 flex-1'>
        <aside
          aria-label='对话历史'
          className='hidden w-72 shrink-0 flex-col border-e bg-muted/20 lg:flex'
        >
          <div className='p-3'>
            <Button
              type='button'
              variant='outline'
              className='w-full justify-start'
              onClick={startNew}
            >
              <Plus aria-hidden='true' />
              新对话
            </Button>
          </div>
          <div className='flex items-center justify-between px-4 pb-2'>
            <span className='text-xs font-medium text-muted-foreground'>
              最近对话
            </span>
            <span className='text-xs text-muted-foreground tabular-nums'>
              {conversations.length}
            </span>
          </div>
          <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3'>
            {orderedConversations.length === 0 ? (
              <p className='px-3 py-8 text-center text-xs text-pretty text-muted-foreground'>
                还没有对话，发送第一个问题后会出现在这里。
              </p>
            ) : (
              <ul className='flex flex-col gap-1'>
                {orderedConversations.map((conversation) => (
                  <li key={conversation.id}>
                    <ConversationButton
                      conversation={conversation}
                      active={conversation.id === activeId}
                      onSelect={() => setActiveId(conversation.id)}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        <main id='agent-main' className='flex min-h-0 min-w-0 flex-1 flex-col'>
          {active ? (
            <>
              <div
                ref={scrollRef}
                role='log'
                aria-live='polite'
                aria-relevant='additions'
                aria-label='对话内容'
                className='min-h-0 flex-1 overflow-y-auto overscroll-contain'
              >
                <div className='mx-auto flex w-full max-w-4xl flex-col gap-7 px-4 py-6 sm:px-6 sm:py-8'>
                  {active.messages.map((message) =>
                    message.role === 'user' ? (
                      <div
                        key={message.id}
                        className='flex flex-col items-end gap-1.5'
                      >
                        <p className='max-w-[85%] rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-sm wrap-break-word whitespace-pre-wrap text-primary-foreground sm:max-w-[75%]'>
                          {message.content}
                        </p>
                        <time
                          dateTime={message.createdAt.toISOString()}
                          className='pe-1 text-xs text-muted-foreground tabular-nums'
                        >
                          {messageTimeFormatter.format(message.createdAt)}
                        </time>
                      </div>
                    ) : (
                      <div key={message.id} className='flex items-start gap-3'>
                        <span className='mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
                          <Bot className='size-4' aria-hidden='true' />
                        </span>
                        <div className='min-w-0 flex-1'>
                          <div className='w-fit max-w-full rounded-2xl rounded-tl-md border bg-card px-4 py-3 text-sm leading-relaxed wrap-break-word whitespace-pre-wrap'>
                            {message.content}
                          </div>
                          <div className='mt-1 flex items-center gap-1'>
                            <time
                              dateTime={message.createdAt.toISOString()}
                              className='text-xs text-muted-foreground tabular-nums'
                            >
                              {messageTimeFormatter.format(message.createdAt)}
                            </time>
                            <Button
                              type='button'
                              size='icon'
                              variant='ghost'
                              className='size-7'
                              aria-label={
                                copiedId === message.id
                                  ? '已复制回答'
                                  : '复制回答'
                              }
                              onClick={() => void copyMessage(message)}
                            >
                              {copiedId === message.id ? (
                                <Check
                                  className='size-3.5 text-emerald-600'
                                  aria-hidden='true'
                                />
                              ) : (
                                <Copy className='size-3.5' aria-hidden='true' />
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              <div className='shrink-0 border-t bg-background/95 px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6'>
                <div className='mx-auto w-full max-w-4xl'>
                  <AgentComposer
                    value={input}
                    onChange={setInput}
                    onSubmit={() => ask(input)}
                    textareaRef={inputRef}
                  />
                  <p className='mt-2 text-center text-xs text-muted-foreground'>
                    回答由 AI 生成，请核实关键信息。
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain'>
              <div className='mx-auto flex min-h-full w-full max-w-4xl flex-col justify-center px-4 py-10 sm:px-6'>
                <div className='flex flex-col items-center text-center'>
                  <span className='flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15'>
                    <Sparkles className='size-7' aria-hidden='true' />
                  </span>
                  <h2 className='mt-5 text-2xl font-semibold tracking-tight text-balance sm:text-3xl'>
                    今天想了解什么？
                  </h2>
                  <p className='mt-2 max-w-md text-sm text-pretty text-muted-foreground'>
                    直接提问，Agent 会结合你的上下文给出回答。
                  </p>
                </div>

                <div className='mt-8'>
                  <AgentComposer
                    value={input}
                    onChange={setInput}
                    onSubmit={() => ask(input)}
                    textareaRef={inputRef}
                  />
                </div>

                <div className='mt-4 grid gap-2 sm:grid-cols-2'>
                  {SUGGESTIONS.map((suggestion) => (
                    <button
                      key={suggestion}
                      type='button'
                      onClick={() => ask(suggestion)}
                      className='group flex items-center justify-between gap-3 rounded-xl border bg-card px-4 py-3 text-start text-sm text-pretty transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
                    >
                      <span className='min-w-0'>{suggestion}</span>
                      <ArrowUpRight
                        className='size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-foreground'
                        aria-hidden='true'
                      />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      <Sheet open={historyOpen} onOpenChange={setHistoryOpen}>
        <SheetContent side='right' className='w-full gap-0 sm:max-w-md'>
          <SheetHeader className='border-b px-4 py-3'>
            <SheetTitle>历史对话</SheetTitle>
            <SheetDescription>
              {conversations.length > 0
                ? `共 ${conversations.length} 个对话，选择后可继续追问。`
                : '还没有历史对话。'}
            </SheetDescription>
          </SheetHeader>

          <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain p-2'>
            {orderedConversations.length === 0 ? (
              <div className='flex flex-col items-center gap-2 px-6 py-12 text-center'>
                <MessageSquare
                  className='size-7 text-muted-foreground'
                  aria-hidden='true'
                />
                <p className='text-sm font-medium'>还没有历史对话</p>
                <p className='text-xs text-muted-foreground'>
                  发送第一个问题后，对话会出现在这里。
                </p>
              </div>
            ) : (
              <ul className='flex flex-col gap-1'>
                {orderedConversations.map((conversation) => (
                  <li key={conversation.id}>
                    <ConversationButton
                      conversation={conversation}
                      active={conversation.id === activeId}
                      onSelect={() => {
                        setActiveId(conversation.id)
                        setHistoryOpen(false)
                      }}
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          <SheetFooter className='border-t'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setHistoryOpen(false)
                startNew()
              }}
            >
              <Plus aria-hidden='true' />
              开始新对话
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </div>
  )
}
