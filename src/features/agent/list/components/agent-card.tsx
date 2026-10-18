import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import {
  Bot,
  Copy,
  MoreHorizontal,
  Pencil,
  Trash2,
  Workflow,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { AgentItem } from '../../data/agent-types'

const GRADIENTS = [
  'from-blue-500 to-indigo-500',
  'from-emerald-500 to-teal-500',
  'from-orange-500 to-amber-500',
  'from-pink-500 to-rose-500',
  'from-purple-500 to-fuchsia-500',
  'from-cyan-500 to-sky-500',
] as const

/** 用 id 稳定地挑一个渐变，避免列表刷新后卡片颜色变化。 */
function gradientFor(id: string) {
  let hash = 0
  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) % GRADIENTS.length
  }
  return GRADIENTS[hash]
}

type AgentCardProps = {
  agent: AgentItem
  onRename: (agent: AgentItem) => void
  onDuplicate: (agent: AgentItem) => void
  onDelete: (agent: AgentItem) => void
}

export function AgentCard({
  agent,
  onRename,
  onDuplicate,
  onDelete,
}: AgentCardProps) {
  const nodeCount = agent.dsl.nodes.length
  const edgeCount = agent.dsl.edges.length

  return (
    <li className='group flex flex-col rounded-xl border bg-card p-5 shadow-xs transition-colors hover:border-primary/40'>
      <div className='flex items-start gap-3'>
        <span
          className={cn(
            'flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white',
            gradientFor(agent.id)
          )}
          aria-hidden='true'
        >
          <Bot className='size-5' />
        </span>
        <div className='min-w-0 flex-1'>
          <Link
            to='/agents/$agentId/flow'
            params={{ agentId: agent.id }}
            className='block truncate font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
          >
            {agent.name}
          </Link>
          <p className='mt-0.5 text-xs text-muted-foreground tabular-nums'>
            更新于 {format(new Date(agent.updatedAt), 'MM-dd HH:mm')}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              aria-label={`管理 ${agent.name}`}
              className='size-8 shrink-0'
            >
              <MoreHorizontal className='size-4' aria-hidden='true' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onSelect={() => onRename(agent)}>
              <Pencil aria-hidden='true' />
              重命名
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onDuplicate(agent)}>
              <Copy aria-hidden='true' />
              复制
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant='destructive'
              onSelect={() => onDelete(agent)}
            >
              <Trash2 aria-hidden='true' />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className='mt-3 line-clamp-2 text-sm text-pretty text-muted-foreground'>
        {agent.description || '暂无描述'}
      </p>

      <div className='mt-4 flex items-center justify-between gap-2 border-t pt-3'>
        <span className='text-xs text-muted-foreground tabular-nums'>
          {nodeCount} 个节点 · {edgeCount} 条连线
        </span>
        <Button asChild variant='ghost' size='sm'>
          <Link
            to='/agents/$agentId/flow'
            params={{ agentId: agent.id }}
            aria-label={`打开 ${agent.name} 的编排`}
          >
            <Workflow className='size-4' aria-hidden='true' />
            编排
          </Link>
        </Button>
      </div>
    </li>
  )
}
