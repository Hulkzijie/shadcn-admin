import { Fragment } from 'react'
import { format } from 'date-fns'
import { MessageCircleQuestion, Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { type QaSession } from '../data/qa-types'

type QaHistoryProps = {
  sessions: QaSession[]
  activeSessionId: string | null
  className?: string
  onSelect: (id: string) => void
  onNew: () => void
  onDelete: (id: string) => void
}

/** 左侧「对话记录」列表 */
export function QaHistory({
  sessions,
  activeSessionId,
  className,
  onSelect,
  onNew,
  onDelete,
}: QaHistoryProps) {
  return (
    <div
      className={cn(
        'flex min-h-0 w-full flex-col gap-2 sm:w-56 lg:w-72 2xl:w-80',
        className
      )}
    >
      <div className='sticky top-0 z-10 -mx-4 bg-background px-4 pb-3 shadow-md sm:static sm:z-auto sm:mx-0 sm:p-0 sm:shadow-none'>
        <div className='flex items-center gap-2 py-2'>
          <h1 className='text-2xl font-bold'>智能问答</h1>
          <MessageCircleQuestion size={20} />
        </div>
        <Button className='w-full' onClick={onNew}>
          <Plus /> 新建问答
        </Button>
      </div>

      <ScrollArea className='-mx-3 min-h-0 flex-1 p-3'>
        {sessions.length === 0 && (
          <p className='px-3 py-6 text-sm text-muted-foreground'>
            暂无对话记录，点击「新建问答」开始提问。
          </p>
        )}
        {sessions.map((session) => {
          const lastMessage = session.messages[session.messages.length - 1]
          return (
            <Fragment key={session.id}>
              <div
                className={cn(
                  'group flex w-full items-center gap-1 rounded-md text-sm hover:bg-accent hover:text-accent-foreground',
                  activeSessionId === session.id && 'bg-muted'
                )}
              >
                <button
                  type='button'
                  className='min-w-0 flex-1 overflow-hidden px-2 py-2 text-start'
                  onClick={() => onSelect(session.id)}
                >
                  <span className='block truncate font-medium'>
                    {session.title}
                  </span>
                  <span className='flex items-center gap-2 text-xs text-muted-foreground group-hover:text-accent-foreground/90'>
                    <span className='block truncate'>
                      {lastMessage?.content || '等待提问…'}
                    </span>
                    {lastMessage && (
                      <span className='shrink-0'>
                        {format(lastMessage.timestamp, 'HH:mm')}
                      </span>
                    )}
                  </span>
                </button>
                <Button
                  type='button'
                  size='icon'
                  variant='ghost'
                  aria-label='删除该对话'
                  className='me-1 size-8 shrink-0 opacity-0 group-hover:opacity-100 focus-visible:opacity-100'
                  onClick={() => onDelete(session.id)}
                >
                  <Trash2 className='size-4 text-destructive' />
                </Button>
              </div>
              <Separator className='my-1' />
            </Fragment>
          )
        })}
      </ScrollArea>
    </div>
  )
}
