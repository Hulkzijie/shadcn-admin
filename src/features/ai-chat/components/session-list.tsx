import { Fragment, useEffect, useState } from 'react'
import { Bot, Pencil, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { type AiSession } from '../data/chat-types'

type SessionListProps = {
  sessions: AiSession[]
  activeSessionId: string | null
  className?: string
  onSelect: (id: string) => void
  onNewChat: () => void
  onDelete: (id: string) => void
}

export function SessionList({
  sessions,
  activeSessionId,
  className,
  onSelect,
  onNewChat,
  onDelete,
}: SessionListProps) {
  const [contextMenu, setContextMenu] = useState<{
    id: string
    x: number
    y: number
  } | null>(null)

  useEffect(() => {
    if (!contextMenu) return
    const closeMenu = () => setContextMenu(null)
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }
    document.addEventListener('click', closeMenu)
    document.addEventListener('scroll', closeMenu, true)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('click', closeMenu)
      document.removeEventListener('scroll', closeMenu, true)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [contextMenu])

  return (
    <div
      className={cn(
        'flex min-h-0 w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80',
        className
      )}
    >
      <div className='sticky top-0 z-10 -mx-4 bg-background px-4 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none'>
        <div className='flex items-center justify-between py-2'>
          <div className='flex items-center gap-2'>
            <h1 className='text-2xl font-bold'>AI Chat</h1>
            <Bot size={20} />
          </div>
          <Button
            size='icon'
            variant='ghost'
            onClick={onNewChat}
            className='rounded-lg'
          >
            <Plus size={24} className='stroke-muted-foreground' />
          </Button>
        </div>
        <Button className='w-full' onClick={onNewChat}>
          <Plus /> New Chat
        </Button>
      </div>

      <ScrollArea className='-mx-3 min-h-0 flex-1 p-3'>
        {sessions.map((session) => {
          const lastMsg = session.messages[session.messages.length - 1]
          return (
            <Fragment key={session.id}>
              <div
                className={cn(
                  'group flex w-full items-start rounded-md text-sm hover:bg-accent hover:text-accent-foreground',
                  activeSessionId === session.id && 'bg-muted'
                )}
                onContextMenu={(event) => {
                  event.preventDefault()
                  setContextMenu({
                    id: session.id,
                    x: event.clientX,
                    y: event.clientY,
                  })
                }}
              >
                <button
                  type='button'
                  className='min-w-0 flex-1 overflow-hidden px-2 py-2 text-start'
                  onClick={() => onSelect(session.id)}
                >
                  {/* 会话列表只展示摘要，避免长问题把历史列表项撑高。 */}
                  <span className='block truncate font-medium'>
                    {session.title}
                  </span>
                  {lastMsg && (
                    <span className='block truncate text-muted-foreground group-hover:text-accent-foreground/90'>
                      {lastMsg.content}
                    </span>
                  )}
                </button>
              </div>
              <Separator className='my-1' />
            </Fragment>
          )
        })}
      </ScrollArea>

      {contextMenu && (
        <div
          role='menu'
          aria-label='会话操作'
          className='fixed z-50 min-w-40 rounded-md border bg-popover p-1 text-popover-foreground shadow-md'
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type='button'
            role='menuitem'
            disabled
            className='relative flex w-full cursor-not-allowed items-center gap-2 rounded-sm px-2 py-1.5 text-start text-sm opacity-50'
          >
            <Pencil className='size-4' />
            <span>重新命名对话</span>
            <span className='ms-auto text-xs text-muted-foreground'>
              功能以后接入
            </span>
          </button>
          <button
            type='button'
            role='menuitem'
            className='relative flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-start text-sm text-destructive outline-hidden hover:bg-destructive/10 focus:bg-destructive/10'
            onClick={() => {
              onDelete(contextMenu.id)
              setContextMenu(null)
            }}
          >
            <Trash2 className='size-4' />
            <span>删除</span>
          </button>
        </div>
      )}
    </div>
  )
}
