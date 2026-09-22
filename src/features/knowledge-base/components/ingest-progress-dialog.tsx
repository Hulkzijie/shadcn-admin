import { useQuery } from '@tanstack/react-query'
import {
  Circle,
  CircleAlert,
  CircleCheck,
  FileText,
  Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
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
import {
  type IngestNode,
  type IngestNodeStatus,
  type IngestTask,
  type IngestTaskSummary,
} from '../data/knowledge-types'
import { fetchIngestTasks, formatDuration } from '../lib/knowledge-service'

const POLL_INTERVAL = 2000

type IngestProgressDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 待查询的入库任务，来自创建响应或列表项内嵌的 tasks */
  summaries: IngestTaskSummary[]
  knowledgeBaseName: string
}

/** done / failed 均为终态，不再轮询 */
function isFinished(status: IngestNodeStatus) {
  return status === 'done' || status === 'failed'
}

const statusMeta: Record<
  IngestNodeStatus,
  { label: string; badge: string; bar: string }
> = {
  pending: {
    label: '等待中',
    badge: 'bg-muted text-muted-foreground',
    bar: 'bg-muted-foreground/40',
  },
  running: {
    label: '处理中',
    badge: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    bar: 'bg-blue-500',
  },
  done: {
    label: '已完成',
    badge: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    bar: 'bg-emerald-500',
  },
  failed: {
    label: '失败',
    badge: 'bg-destructive/10 text-destructive',
    bar: 'bg-destructive',
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
  if (status === 'failed') {
    return <CircleAlert className='size-4 shrink-0 text-destructive' />
  }
  return <Circle className='size-4 shrink-0 text-muted-foreground/50' />
}

function IngestNodeRow({ node }: { node: IngestNode }) {
  return (
    <li className='space-y-1'>
      <div className='flex items-center gap-2 text-xs'>
        <NodeStatusIcon status={node.status} />
        <span
          className={cn(
            'min-w-0 flex-1 truncate',
            node.status === 'pending' && 'text-muted-foreground',
            node.status === 'failed' && 'font-medium text-destructive'
          )}
          title={node.name}
        >
          {node.name}
        </span>
        <span className='shrink-0 text-muted-foreground tabular-nums'>
          {node.durationMs === null ? '—' : formatDuration(node.durationMs)}
        </span>
      </div>
      {/* 失败节点直接给出原因，用于定位「卡在哪、为什么」 */}
      {node.message && (
        <p className='ml-6 rounded-md bg-destructive/10 px-2 py-1 text-xs break-all text-destructive'>
          {node.message}
        </p>
      )}
    </li>
  )
}

function IngestTaskCard({ task }: { task: IngestTask }) {
  const meta = statusMeta[task.status]
  const doneCount = task.nodes.filter((n) => n.status === 'done').length
  const runningCount = task.nodes.filter((n) => n.status === 'running').length
  const failedNode = task.nodes.find((n) => n.status === 'failed')

  return (
    <div className='space-y-3 rounded-lg border bg-card p-4'>
      <div className='flex items-start gap-3'>
        <FileText className='mt-0.5 size-4 shrink-0 text-muted-foreground' />
        <div className='min-w-0 flex-1'>
          <p
            className='truncate text-sm font-medium'
            title={task.fileName ?? task.id}
          >
            {task.fileName ?? task.id}
          </p>
          {task.fileName && (
            <p
              className='mt-0.5 truncate font-mono text-xs text-muted-foreground'
              title={task.id}
            >
              {task.id}
            </p>
          )}
        </div>
        <div className='flex shrink-0 items-center gap-2'>
          {task.status === 'running' && (
            <Loader2 className='size-3.5 animate-spin text-blue-600 dark:text-blue-400' />
          )}
          <Badge className={cn('text-xs', meta.badge)}>{meta.label}</Badge>
        </div>
      </div>

      {/* 当前节点：直接回答「卡在哪个节点」 */}
      {task.status === 'running' && task.currentNode && (
        <p className='rounded-md bg-blue-500/10 px-3 py-2 text-xs text-blue-600 dark:text-blue-400'>
          当前节点：{task.currentNode}
        </p>
      )}

      {task.status === 'failed' && !failedNode && (
        <p className='rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive'>
          任务失败，后端未返回失败节点与原因。
        </p>
      )}

      <div className='space-y-1.5'>
        <div className='flex items-center justify-between text-xs text-muted-foreground'>
          <span>
            已完成 {doneCount} / 共 {task.nodes.length} 步
            {runningCount > 0 && `，进行中 ${runningCount}`}
            {task.elapsedMs > 0 && `，总耗时 ${formatDuration(task.elapsedMs)}`}
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

      {task.nodes.length > 0 ? (
        <ul className='space-y-2 border-t pt-3'>
          {task.nodes.map((node, index) => (
            <IngestNodeRow key={`${node.name}-${index}`} node={node} />
          ))}
        </ul>
      ) : (
        <p className='border-t pt-3 text-xs text-muted-foreground'>
          {task.status === 'pending'
            ? '后端未返回该任务的进度，可能尚未开始或任务状态已清理。'
            : '后端未返回节点清单。'}
        </p>
      )}
    </div>
  )
}

export function IngestProgressDialog({
  open,
  onOpenChange,
  summaries,
  knowledgeBaseName,
}: IngestProgressDialogProps) {
  const taskIds = summaries.map((item) => item.taskId)

  const {
    data: tasks = [],
    isPending,
    isError,
  } = useQuery({
    queryKey: ['ingest-tasks', summaries],
    queryFn: () => fetchIngestTasks(summaries),
    enabled: open && taskIds.length > 0,
    // 轮询接口不做重试，失败即停，避免持续请求
    retry: false,
    refetchInterval: (query) => {
      // 只要本次请求报错就停止轮询
      if (query.state.error) return false
      const list = query.state.data
      if (!list || list.length === 0) return POLL_INTERVAL
      return list.every((task) => isFinished(task.status))
        ? false
        : POLL_INTERVAL
    },
  })

  const total = tasks.length
  const doneCount = tasks.filter((t) => t.status === 'done').length
  const failedCount = tasks.filter((t) => t.status === 'failed').length
  const runningCount = tasks.filter((t) => t.status === 'running').length
  const pendingCount = tasks.filter((t) => t.status === 'pending').length
  const allFinished = total > 0 && tasks.every((t) => isFinished(t.status))
  const progress = total > 0 ? Math.round((doneCount / total) * 100) : 0

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] overflow-hidden p-0 sm:max-w-2xl'>
        <DialogHeader className='px-6 pt-6'>
          <DialogTitle>入库进度</DialogTitle>
          <DialogDescription>
            {knowledgeBaseName
              ? `知识库「${knowledgeBaseName}」的文件解析与向量入库情况。`
              : '文件解析与向量入库情况。'}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className='max-h-[calc(90vh-11rem)] px-6'>
          <div className='space-y-4 pb-2'>
            {isError && total === 0 && (
              <p className='py-10 text-center text-sm text-destructive'>
                获取入库进度失败，请稍后重新打开查看。
              </p>
            )}

            {isError && total > 0 && (
              <p className='rounded-lg bg-destructive/10 px-4 py-3 text-center text-sm text-destructive'>
                进度更新已中断，当前为最后一次获取到的状态。
              </p>
            )}

            {!isError && total === 0 && (
              <p className='py-10 text-center text-sm text-muted-foreground'>
                {taskIds.length === 0
                  ? '暂无可查询的入库任务。'
                  : isPending
                    ? '正在获取入库进度...'
                    : '暂无入库任务。'}
              </p>
            )}

            {total > 0 && (
              <div className='space-y-3 rounded-lg border bg-muted/40 p-4'>
                <div className='flex flex-wrap items-center justify-between gap-2'>
                  <span className='text-sm font-medium'>共 {total} 个文件</span>
                  <span className='flex flex-wrap items-center gap-3 text-xs'>
                    <span className='text-emerald-600 dark:text-emerald-400'>
                      完成 {doneCount}
                    </span>
                    <span className='text-blue-600 dark:text-blue-400'>
                      处理中 {runningCount}
                    </span>
                    <span className='text-muted-foreground'>
                      等待 {pendingCount}
                    </span>
                    <span className='text-destructive'>失败 {failedCount}</span>
                  </span>
                </div>
                <div className='h-1.5 w-full overflow-hidden rounded-full bg-muted'>
                  <div
                    className='h-full rounded-full bg-emerald-500 transition-all duration-500'
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {allFinished && (
                  <p
                    className={cn(
                      'text-xs',
                      failedCount > 0
                        ? 'text-destructive'
                        : 'text-emerald-600 dark:text-emerald-400'
                    )}
                  >
                    {failedCount > 0
                      ? `入库结束：${doneCount} 个成功，${failedCount} 个失败，请查看失败节点的原因。`
                      : '全部文件入库完成。'}
                  </p>
                )}
              </div>
            )}

            {tasks.map((task) => (
              <IngestTaskCard key={task.id} task={task} />
            ))}
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
