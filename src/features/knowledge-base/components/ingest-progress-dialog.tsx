import { useQuery } from '@tanstack/react-query'
import {
  Circle,
  CircleAlert,
  CircleCheck,
  FileText,
  Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { type IngestNodeStatus, type IngestTask } from '../data/knowledge-types'
import {
  fetchIngestTasks,
  formatBytes,
  formatDuration,
} from '../lib/knowledge-service'

const POLL_INTERVAL = 2000

type IngestProgressDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  knowledgeBaseId: string | null
  knowledgeBaseName: string
}

const statusMeta: Record<
  IngestNodeStatus,
  { label: string; badge: string; bar: string; suffix: string }
> = {
  pending: {
    label: '等待中',
    badge: 'bg-muted text-muted-foreground',
    bar: 'bg-muted-foreground/40',
    suffix: '节点等待中',
  },
  running: {
    label: '处理中',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    bar: 'bg-blue-500',
    suffix: '节点执行中',
  },
  done: {
    label: '已完成',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    bar: 'bg-emerald-500',
    suffix: '节点执行完成',
  },
  error: {
    label: '失败',
    badge: 'bg-destructive/10 text-destructive',
    bar: 'bg-destructive',
    suffix: '节点执行失败',
  },
}

function NodeStatusIcon({ status }: { status: IngestNodeStatus }) {
  if (status === 'done') {
    return <CircleCheck className='size-4 shrink-0 text-emerald-600' />
  }
  if (status === 'running') {
    return (
      <Loader2 className='size-4 shrink-0 animate-spin text-blue-600 dark:text-blue-400' />
    )
  }
  if (status === 'error') {
    return <CircleAlert className='size-4 shrink-0 text-destructive' />
  }
  return <Circle className='size-4 shrink-0 text-muted-foreground/50' />
}

function IngestTaskCard({ task }: { task: IngestTask }) {
  const meta = statusMeta[task.status]
  const doneCount = task.nodes.filter((n) => n.status === 'done').length
  const runningCount = task.nodes.filter((n) => n.status === 'running').length

  return (
    <div className='space-y-3 rounded-lg border bg-card p-4'>
      <div className='flex items-start gap-3'>
        <FileText className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
        <div className='min-w-0 flex-1'>
          <p className='truncate text-sm font-medium' title={task.fileName}>
            {task.fileName}
          </p>
          <p className='mt-0.5 text-xs text-muted-foreground'>
            {formatBytes(task.fileSize)}
          </p>
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          {task.status === 'running' && (
            <Loader2 className='size-3.5 animate-spin text-blue-600 dark:text-blue-400' />
          )}
          <Badge className={cn('text-xs', meta.badge)}>{meta.label}</Badge>
        </div>
      </div>

      <div className='space-y-1.5'>
        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <span>
            运行日志(已完成:{doneCount},进行中:{runningCount},共{task.nodes.length}
            步|总耗时:{formatDuration(task.elapsedMs)})
          </span>
          <span className='font-medium text-foreground'>{task.progress}%</span>
        </div>
        <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
          <div
            className={cn(
              'h-full rounded-full transition-all duration-500',
              meta.bar
            )}
            style={{ width: `${Math.min(100, Math.max(0, task.progress))}%` }}
          />
        </div>
      </div>

      {task.nodes.length > 0 && (
        <ul className='space-y-2 border-t pt-3'>
          {task.nodes.map((node, index) => (
            <li
              key={`${node.name}-${index}`}
              className='flex items-center gap-2 text-xs'
            >
              <NodeStatusIcon status={node.status} />
              <span
                className={cn(
                  'min-w-0 flex-1 truncate',
                  node.status === 'pending' && 'text-muted-foreground'
                )}
                title={node.name}
              >
                {node.name}
                {statusMeta[node.status].suffix}
              </span>
              <span className='shrink-0 tabular-nums text-muted-foreground'>
                {node.durationMs === null ? '—' : formatDuration(node.durationMs)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function IngestProgressDialog({
  open,
  onOpenChange,
  knowledgeBaseId,
  knowledgeBaseName,
}: IngestProgressDialogProps) {
  const { data: tasks = [], isPending, isError } = useQuery({
    queryKey: ['knowledge-base', knowledgeBaseId, 'ingest-tasks'],
    queryFn: () => fetchIngestTasks(knowledgeBaseId as string),
    enabled: open && !!knowledgeBaseId,
    refetchInterval: (query) => {
      const list = query.state.data
      if (!list || list.length === 0) return POLL_INTERVAL
      const finished = list.every(
        (task) => task.status === 'done' || task.status === 'error'
      )
      return finished ? false : POLL_INTERVAL
    },
  })

  const allFinished =
    tasks.length > 0 &&
    tasks.every((task) => task.status === 'done' || task.status === 'error')

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-hidden p-0 sm:max-w-2xl'>
        <DialogHeader className='px-6 pt-6'>
          <DialogTitle>入库进度</DialogTitle>
          <DialogDescription>
            {knowledgeBaseName
              ? `知识库「${knowledgeBaseName}」正在解析文件并写入向量库。`
              : '正在解析文件并写入向量库。'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='max-h-[calc(90vh-11rem)] px-6'>
          <div className='space-y-4 pb-2'>
            {isPending && (
              <p className='py-10 text-center text-sm text-muted-foreground'>
                正在获取入库进度...
              </p>
            )}

            {isError && (
              <p className='py-10 text-center text-sm text-destructive'>
                获取入库进度失败，请确认后端已实现该接口。
              </p>
            )}

            {!isPending && !isError && tasks.length === 0 && (
              <p className='py-10 text-center text-sm text-muted-foreground'>
                暂无入库任务。
              </p>
            )}

            {tasks.map((task) => (
              <IngestTaskCard key={task.id} task={task} />
            ))}

            {allFinished && (
              <p className='rounded-lg bg-emerald-500/10 px-4 py-3 text-center text-sm text-emerald-600 dark:text-emerald-400'>
                全部文件入库完成，可以关闭本窗口。
              </p>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className='border-t px-6 py-4'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
