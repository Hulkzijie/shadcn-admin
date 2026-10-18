import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  NODE_KIND_META,
  NODE_KIND_ORDER,
  type AgentFlowNode,
  type FlowNodeData,
} from './data/flow-presets'
import { useFlowActions } from './flow-actions-context'

function NodeAddButton({
  nodeId,
  className,
}: {
  nodeId: string
  className?: string
}) {
  const { addNextNode } = useFlowActions()

  return (
    <div
      className={cn(
        'nodrag nopan absolute top-1/2 -right-5 -translate-y-1/2',
        className
      )}
    >
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type='button'
            aria-label='添加下一个节点'
            onPointerDown={(event) => event.stopPropagation()}
            onClick={(event) => event.stopPropagation()}
            className={cn(
              'flex size-5 items-center justify-center rounded-full border-2 border-background bg-muted-foreground text-background shadow-xs transition-[transform,background-color]',
              'hover:scale-110 hover:bg-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none data-[state=open]:scale-110 data-[state=open]:bg-primary'
            )}
          >
            <Plus className='size-2.5' strokeWidth={3} aria-hidden='true' />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align='center'
          side='right'
          sideOffset={10}
          onClick={(event) => event.stopPropagation()}
          className='nodrag nopan w-60'
        >
          <DropdownMenuLabel className='text-xs text-muted-foreground'>
            添加下一个节点
          </DropdownMenuLabel>
          {NODE_KIND_ORDER.filter((kind) => kind !== 'start').map((kind) => {
            const itemMeta = NODE_KIND_META[kind]
            const ItemIcon = itemMeta.icon

            return (
              <DropdownMenuItem
                key={kind}
                onSelect={() => addNextNode(nodeId, kind)}
                className='gap-2.5 py-2'
              >
                <span
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-md',
                    itemMeta.iconClassName
                  )}
                >
                  <ItemIcon className='size-3.5' aria-hidden='true' />
                </span>
                <span className='min-w-0 flex-1'>
                  <span className='block text-sm font-medium'>
                    {itemMeta.label}
                  </span>
                  <span className='block truncate text-xs text-muted-foreground'>
                    {itemMeta.summary}
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

function AgentNodeComponent({ id, data, selected }: NodeProps<AgentFlowNode>) {
  const meta = NODE_KIND_META[data.kind]
  const Icon = meta.icon
  const nodeData: FlowNodeData = data

  return (
    <div
      className={cn(
        'relative w-56 rounded-xl border bg-card px-3.5 py-3 text-card-foreground shadow-xs transition-[box-shadow,border-color]',
        selected
          ? 'border-ring shadow-md ring-2 ring-ring/40'
          : 'hover:border-ring/60'
      )}
    >
      {data.kind !== 'start' && (
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
          <p className='truncate text-sm font-medium'>{nodeData.label}</p>
          <p className='truncate text-xs text-muted-foreground'>{meta.label}</p>
        </div>
      </div>

      {nodeData.description && (
        <p className='mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground'>
          {nodeData.description}
        </p>
      )}

      {nodeData.config && (
        <p className='mt-2 truncate rounded-md bg-muted/60 px-2 py-1 font-mono text-[11px] text-muted-foreground'>
          {nodeData.config}
        </p>
      )}

      {data.kind !== 'end' && (
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

export const AgentNode = memo(AgentNodeComponent)
