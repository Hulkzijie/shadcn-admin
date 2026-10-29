import type { DragEvent } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { FlowRegistryView } from './flow-context'

type NodePaletteProps = {
  registry: FlowRegistryView
  onAdd: (kind: string) => void
  className?: string
}

export function NodePalette({ registry, onAdd, className }: NodePaletteProps) {
  const groups: Array<{ title: string; kinds: string[] }> = []
  for (const kind of registry.kinds) {
    const meta = registry.meta[kind]
    if (!meta) continue
    const title = meta.group ?? '其他'
    const group = groups.find((item) => item.title === title)
    if (group) group.kinds.push(kind)
    else groups.push({ title, kinds: [kind] })
  }
  if (registry.groups) {
    groups.sort(
      (a, b) =>
        registry.groups!.indexOf(a.title) - registry.groups!.indexOf(b.title)
    )
  }

  const handleDragStart = (
    event: DragEvent<HTMLButtonElement>,
    kind: string
  ) => {
    event.dataTransfer.setData(registry.dragMime, kind)
    event.dataTransfer.effectAllowed = 'move'
  }

  return (
    <aside
      aria-label='节点库'
      className={cn(
        'flex shrink-0 gap-2 overflow-x-auto border-b bg-muted/20 p-3 lg:w-60 lg:flex-col lg:gap-1.5 lg:overflow-y-auto lg:border-e lg:border-b-0',
        className
      )}
    >
      <div className='hidden lg:mb-1 lg:block'>
        <h2 className='text-xs font-medium text-muted-foreground'>节点库</h2>
        <p className='mt-1 text-xs text-pretty text-muted-foreground'>
          拖拽到画布，或点击直接添加。
        </p>
      </div>

      {groups.map((group) => (
        <div
          key={group.title}
          className='flex shrink-0 gap-2 lg:flex-col lg:gap-1.5'
        >
          <p className='hidden px-1 pt-1 text-[11px] font-medium tracking-wide text-muted-foreground uppercase lg:block'>
            {group.title}
          </p>
          {group.kinds.map((kind) => {
            const meta = registry.meta[kind]
            const Icon = meta.icon
            return (
              <button
                key={kind}
                type='button'
                draggable
                onDragStart={(event) => handleDragStart(event, kind)}
                onClick={() => onAdd(kind)}
                className='group flex w-44 shrink-0 cursor-grab items-center gap-2.5 rounded-lg border bg-card px-3 py-2.5 text-start transition-colors hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:cursor-grabbing lg:w-full'
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
                  className='size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100'
                  aria-hidden='true'
                />
              </button>
            )
          })}
        </div>
      ))}

      <p className='mt-2 hidden rounded-lg border border-dashed px-3 py-2.5 text-xs text-pretty text-muted-foreground lg:block'>
        点击节点右侧 + 号可添加并自动连线；也可从圆点拖到其它节点连线。
      </p>
    </aside>
  )
}
