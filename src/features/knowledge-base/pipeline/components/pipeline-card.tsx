import { format } from 'date-fns'
import { Link } from '@tanstack/react-router'
import { Copy, MoreHorizontal, Trash2, Workflow } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { dataTypeOptions } from '../../data/knowledge-types'
import type { PipelineTemplate } from '../data/pipeline-types'

const STATUS_LABELS: Record<PipelineTemplate['status'], string> = {
  draft: '草稿',
  published: '已发布',
  archived: '已归档',
}

type PipelineCardProps = {
  pipeline: PipelineTemplate
  onDuplicate: (pipeline: PipelineTemplate) => void
  onDelete: (pipeline: PipelineTemplate) => void
}

export function PipelineCard({
  pipeline,
  onDuplicate,
  onDelete,
}: PipelineCardProps) {
  const dataTypeLabel =
    dataTypeOptions.find((option) => option.value === pipeline.dataType)
      ?.label ?? pipeline.dataType
  const isSystem = pipeline.scope === 'system'

  return (
    <li className='group flex flex-col rounded-xl border bg-card p-5 shadow-xs transition-colors hover:border-primary/40'>
      <div className='flex items-start gap-3'>
        <span
          className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'
          aria-hidden='true'
        >
          <Workflow className='size-5' />
        </span>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <Link
              to='/knowledge-base/pipelines/$pipelineId'
              params={{ pipelineId: pipeline.id }}
              className='truncate font-semibold underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none'
            >
              {pipeline.name}
            </Link>
            {isSystem && <Badge variant='outline'>系统模板</Badge>}
          </div>
          <p className='mt-0.5 text-xs text-muted-foreground tabular-nums'>
            更新于 {format(new Date(pipeline.updatedAt), 'MM-dd HH:mm')}
          </p>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              type='button'
              variant='ghost'
              size='icon'
              aria-label={`管理 ${pipeline.name}`}
              className='size-8 shrink-0'
            >
              <MoreHorizontal className='size-4' aria-hidden='true' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem onSelect={() => onDuplicate(pipeline)}>
              <Copy aria-hidden='true' />
              复制为我的模板
            </DropdownMenuItem>
            {!isSystem && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  variant='destructive'
                  onSelect={() => onDelete(pipeline)}
                >
                  <Trash2 aria-hidden='true' />
                  删除
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className='mt-3 line-clamp-2 text-sm text-pretty text-muted-foreground'>
        {pipeline.description || '暂无描述'}
      </p>

      <div className='mt-3 flex flex-wrap items-center gap-2'>
        <Badge variant='secondary'>{dataTypeLabel}</Badge>
        <Badge variant={pipeline.status === 'published' ? 'default' : 'outline'}>
          {STATUS_LABELS[pipeline.status]}
        </Badge>
        <span className='text-xs text-muted-foreground tabular-nums'>
          v{pipeline.latestVersion}
        </span>
      </div>

      <div className='mt-4 flex items-center justify-between gap-2 border-t pt-3'>
        <span className='text-xs text-muted-foreground tabular-nums'>
          {pipeline.dsl.nodes.length} 个节点 · {pipeline.dsl.edges.length} 条连线
        </span>
        <Button asChild variant='ghost' size='sm'>
          <Link
            to='/knowledge-base/pipelines/$pipelineId'
            params={{ pipelineId: pipeline.id }}
            aria-label={`打开 ${pipeline.name} 的编排`}
          >
            <Workflow className='size-4' aria-hidden='true' />
            编排
          </Link>
        </Button>
      </div>
    </li>
  )
}
