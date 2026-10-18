import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  NODE_DRAG_MIME,
  NODE_KIND_META,
  NODE_KIND_ORDER,
  type NodeKind,
} from './data/flow-presets'

type NodePaletteProps = {
  onAdd: (kind: NodeKind) => void
}

export function NodePalette({ onAdd }: NodePaletteProps) {
  return (
    <aside
      aria-label='节点库'
      className='flex shrink-0 gap-2 overflow-x-auto border-b bg-muted/20 p-3 lg:w-60 lg:flex-col lg:gap-1.5 lg:overflow-y-auto lg:border-e lg:border-b-0'
    >
      <div className='hidden lg:mb-1 lg:block'>
        <h2 className='text-xs font-medium text-muted-foreground'>节点库</h2>
        <p className='mt-1 text-xs text-pretty text-muted-foreground'>
          拖拽到画布，或点击直接添加。
        </p>
      </div>

      {NODE_KIND_ORDER.map((kind) => {
        const meta = NODE_KIND_META[kind]
        const Icon = meta.icon

        return (
          <button
            key={kind}
            type='button'
            draggable
            onDragStart={(event) => {
              event.dataTransfer.setData(NODE_DRAG_MIME, kind)
              event.dataTransfer.effectAllowed = 'move'
            }}
            onClick={() => onAdd(kind)}
            className={cn(
              'group flex w-44 shrink-0 cursor-grab items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 text-start transition-colors',
              'hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing',
              'lg:w-full'
            )}
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
              <span className='block truncate text-sm font-medium'>
                {meta.label}
              </span>
              <span className='hidden truncate text-xs text-muted-foreground lg:block'>
                {meta.summary}
              </span>
            </span>
            <Plus
              className='size-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100'
              aria-hidden='true'
            />
          </button>
        )
      })}

      <p className='mt-2 hidden rounded-lg border border-dashed px-3 py-2.5 text-xs text-pretty text-muted-foreground lg:block'>
        点击节点右侧 + 号可添加并自动连线；也可从圆点拖到其它节点连线。
      </p>
    </aside>
  )
}
