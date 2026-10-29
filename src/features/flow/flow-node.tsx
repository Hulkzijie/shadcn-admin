import { memo, type MouseEvent } from 'react'
import { Handle, Position, type Node, type NodeProps } from '@xyflow/react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useFlowActions, useFlowRegistry } from './flow-context'
import type { FlowNodeDataBase } from './types'

const stop = (event: MouseEvent) => event.stopPropagation()

function NodeAddButton({ nodeId }: { nodeId: string }) {
  const { addNextNode } = useFlowActions()
  const registry = useFlowRegistry()

  return (
    <div className='nodrag nopan absolute top-1/2 -right-5 -translate-y-1/2'>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type='button'
            aria-label='添加下一个节点'
            className='flex size-5 items-center justify-center rounded-full border-2 border-background bg-muted-foreground text-background shadow-xs transition-[transform,background-color] hover:scale-110 hover:bg-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[state=open]:scale-110 data-[state=open]:bg-primary'
            onPointerDown={stop}
            onClick={stop}
          >
            <Plus className='size-2.5' strokeWidth={3} aria-hidden='true' />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='center'
          side='right'
          sideOffset={10}
          onClick={stop}
          className='nodrag nopan w-60'
        >
          <DropdownMenuLabel>添加下一个节点</DropdownMenuLabel>
          {registry.kinds
            // 入口型节点不能接收连线，挂到下游没有意义。
            .filter((kind) => registry.meta[kind]?.canReceive !== false)
            .map((kind) => {
              const meta = registry.meta[kind]
              const Icon = meta.icon
              return (
                <DropdownMenuItem
                  key={kind}
                  className='gap-2.5 py-2'
                  onSelect={() => addNextNode(nodeId, kind)}
                >
                  <span
                    className={cn(
                      'flex size-7 shrink-0 items-center justify-center rounded-md',
                      meta.iconClassName
                    )}
                  >
                    <Icon className='size-3.5' aria-hidden='true' />
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block text-sm font-medium'>
                      {meta.label}
                    </span>
                    <span className='block truncate text-xs text-muted-foreground'>
                      {meta.summary}
                    </span>
                  </span>
                </DropdownMenuItem>
              )
            })}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

function FlowNodeComponent({
  id,
  data,
  selected,
}: NodeProps<Node<FlowNodeDataBase, 'flow'>>) {
  const registry = useFlowRegistry()
  const meta = registry.meta[data.kind]
  if (!meta) return null

  const Icon = meta.icon
  const disabled = (data as { enabled?: boolean }).enabled === false
  const summary = meta.describe?.(data)

  return (
    <div
      className={cn(
        'relative w-56 rounded-xl border bg-card px-3.5 py-3 text-card-foreground shadow-xs transition-[box-shadow,border-color]',
        selected
          ? 'border-ring shadow-md ring-2 ring-ring/40'
          : 'hover:border-ring/60',
        disabled && 'border-dashed opacity-60'
      )}
    >
      {meta.canReceive === false ? null : (
        <Handle
          type='target'
          position={Position.Left}
          className='size-2.5 border-2 border-background bg-muted-foreground'
        />
      )}

      <div className='flex items-center gap-2.5'>
        <span
          className={cn(
            'flex size-8 shrink-0 items-center justify-center rounded-lg',
            meta.iconClassName
          )}
        >
          <Icon className='size-4' aria-hidden='true' />
        </span>
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-medium'>{data.label}</p>
          <p className='truncate text-xs text-muted-foreground'>
            {disabled ? `${meta.label} · 已停用` : meta.label}
          </p>
        </div>
      </div>

      {data.description ? (
        <p className='mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground'>
          {data.description}
        </p>
      ) : null}

      {summary ? (
        <p className='mt-2 truncate rounded-md bg-muted/60 px-2 py-1 font-mono text-[11px] text-muted-foreground'>
          {summary}
        </p>
      ) : null}

      {meta.canEmit === false ? null : (
        <>
          <Handle
            type='source'
            position={Position.Right}
            className='size-2.5 border-2 border-background bg-muted-foreground'
          />
          <NodeAddButton nodeId={id} />
        </>
      )}
    </div>
  )
}

export const FlowNodeCard = memo(FlowNodeComponent)
