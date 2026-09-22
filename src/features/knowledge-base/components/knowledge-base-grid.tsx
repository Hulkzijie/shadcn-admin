import { format } from 'date-fns'
import {
  Activity,
  ArrowRight,
  FileText,
  Table2,
  ImageIcon,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  type KnowledgeBaseItem,
  type KnowledgeDataType,
  dataTypeOptions,
} from '../data/knowledge-types'

type KnowledgeBaseGridProps = {
  items: KnowledgeBaseItem[]
  isLoading?: boolean
  isError?: boolean
  onDelete: (item: KnowledgeBaseItem) => void
  onViewProgress: (item: KnowledgeBaseItem) => void
}

const dataTypeIconMap: Record<KnowledgeDataType, typeof FileText> = {
  unstructured: FileText,
  structured: Table2,
  multimodal: ImageIcon,
}

const dataTypeColorMap: Record<KnowledgeDataType, string> = {
  unstructured:
    'bg-blue-500/10 text-blue-600 ring-blue-500/15 dark:text-blue-400',
  structured:
    'bg-emerald-500/10 text-emerald-600 ring-emerald-500/15 dark:text-emerald-400',
  multimodal:
    'bg-purple-500/10 text-purple-600 ring-purple-500/15 dark:text-purple-400',
}

function getDataTypeLabel(value: KnowledgeDataType) {
  return dataTypeOptions.find((o) => o.value === value)?.label ?? value
}

export function KnowledgeBaseGrid({
  items,
  isLoading,
  isError,
  onDelete,
  onViewProgress,
}: KnowledgeBaseGridProps) {
  if (isLoading) {
    return (
      <p className='py-16 text-center text-sm text-muted-foreground'>
        正在加载知识库…
      </p>
    )
  }

  if (isError) {
    return (
      <p className='py-16 text-center text-sm text-destructive'>
        知识库列表加载失败，请稍后重试。
      </p>
    )
  }

  if (items.length === 0) {
    return (
      <p className='py-16 text-center text-sm text-muted-foreground'>
        暂无知识库，点击右上角「创建知识库」开始吧。
      </p>
    )
  }

  return (
    <ul className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
      {items.map((item) => {
        const Icon = dataTypeIconMap[item.dataType]
        return (
          <li
            key={item.id}
            className='group relative flex min-h-64 flex-col overflow-hidden rounded-xl border bg-card shadow-xs transition-[transform,box-shadow,border-color] duration-200 hover:-translate-y-0.5 hover:border-foreground/15 hover:shadow-md'
          >
            <Button
              variant='ghost'
              size='icon'
              className='absolute top-3 right-3 z-10 size-8 text-muted-foreground opacity-70 transition-[opacity,color,background-color] hover:bg-destructive/10 hover:text-destructive md:opacity-0 md:group-hover:opacity-100 md:focus-visible:opacity-100'
              aria-label={`删除 ${item.name}`}
              onClick={() => onDelete(item)}
            >
              <Trash2 className='size-4' />
            </Button>

            <div className='flex flex-1 flex-col p-5 pb-4'>
              <div className='flex items-center gap-3.5 pr-8'>
                <div
                  className={cn(
                    'flex size-11 shrink-0 items-center justify-center rounded-xl ring-1',
                    dataTypeColorMap[item.dataType]
                  )}
                >
                  <Icon className='size-5' />
                </div>
                <div className='min-w-0 flex-1'>
                  <h3 className='truncate font-semibold tracking-tight'>
                    {item.name}
                  </h3>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    创建于 {format(item.createdAt, 'yyyy-MM-dd')}
                  </p>
                </div>
              </div>

              <p className='mt-5 line-clamp-2 min-h-10 text-sm leading-5 text-muted-foreground'>
                {item.description || '暂无描述'}
              </p>

              <div className='mt-auto flex flex-wrap items-center gap-2 pt-5 text-xs'>
                <Badge
                  variant='outline'
                  className='h-6 border-border/80 bg-muted/40 px-2 font-normal text-foreground'
                >
                  {getDataTypeLabel(item.dataType)}
                </Badge>
                <span className='rounded-md bg-muted/60 px-2 py-1 text-muted-foreground'>
                  {item.fileCount} 个文件
                </span>
                {item.segmentMode === 'custom' && (
                  <span className='rounded-md bg-muted/60 px-2 py-1 text-muted-foreground'>
                    自定义分段
                  </span>
                )}
                {item.enhancement && (
                  <span className='rounded-md bg-muted/60 px-2 py-1 text-muted-foreground'>
                    知识增强
                  </span>
                )}
              </div>
            </div>

            <div className='border-t bg-muted/20 p-2'>
              <Button
                variant='ghost'
                size='sm'
                className='h-10 w-full justify-between px-3 font-medium hover:bg-background hover:shadow-xs'
                onClick={() => onViewProgress(item)}
              >
                <span className='flex items-center gap-2'>
                  <span className='flex size-6 items-center justify-center rounded-md bg-primary/8 text-primary'>
                    <Activity className='size-3.5' />
                  </span>
                  查看入库进度
                </span>
                <ArrowRight className='size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5' />
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
