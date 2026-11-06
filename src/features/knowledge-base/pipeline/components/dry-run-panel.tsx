import { useRef, useState } from 'react'
import {
  CircleAlert,
  CircleCheck,
  CircleMinus,
  FlaskConical,
  Loader2,
  Play,
  TriangleAlert,
  Upload,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
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
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  dataTypeOptions,
  type KnowledgeDataType,
} from '../../data/knowledge-types'
import {
  formatBytes,
  formatDuration,
  validateFile,
} from '../../lib/knowledge-service'
import type { PipelineDsl } from '../data/pipeline-types'
import {
  DryRunError,
  runPipelineDryRun,
  type DryRunArtifact,
  type DryRunIssue,
  type DryRunNodeRun,
  type DryRunResult,
} from '../lib/pipeline-dry-run'

/** 只有这类后缀能直接读取为纯文本，其余格式仅用于校验文件名。 */
const TEXT_FORMATS = new Set([
  'TXT',
  'MD',
  'MARKDOWN',
  'CSV',
  'JSON',
  'YAML',
  'YML',
  'HTML',
  'XML',
])

const RUN_STATUS_LABELS: Record<string, string> = {
  queued: '排队中',
  running: '执行中',
  succeeded: '成功',
  failed: '失败',
  canceled: '已取消',
  waiting_review: '待人工复核',
}

const NODE_STATUS_LABELS: Record<string, string> = {
  pending: '待执行',
  running: '执行中',
  retrying: '重试中',
  succeeded: '成功',
  failed: '失败',
  skipped: '已跳过',
  blocked: '已阻断',
  waiting_review: '待复核',
}

/** 截止节点下拉里代表「执行到流程结束」的哨兵值。 */
const RUN_TO_END = '__end__'

type DryRunPanelProps = {
  pipelineId: string
  dsl: PipelineDsl
  dataType: KnowledgeDataType
}

/**
 * 试运行面板（PRD 8.6）。
 * 入口按钮直接放在编排页头部，提交的是画布当前编排（含未保存改动）。
 */
export function DryRunButton({ pipelineId, dsl, dataType }: DryRunPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <Button
        type='button'
        variant='ghost'
        size='sm'
        onClick={() => setOpen(true)}
        className='px-2 sm:px-3'
      >
        <FlaskConical className='size-4' aria-hidden='true' />
        <span className='hidden sm:inline'>试运行</span>
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className='flex max-h-[88svh] flex-col overflow-hidden sm:max-w-2xl'>
          <DialogHeader>
            <DialogTitle>试运行编排</DialogTitle>
            <DialogDescription>
              使用当前画布内容跑一次不写正式向量库的完整链路，可上传文本或直接使用内置示例。
            </DialogDescription>
          </DialogHeader>
          {open ? (
            <DryRunBody pipelineId={pipelineId} dsl={dsl} dataType={dataType} />
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  )
}

function DryRunBody({ pipelineId, dsl, dataType }: DryRunPanelProps) {
  const formats =
    dataTypeOptions.find((option) => option.value === dataType)?.formats ?? []
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [text, setText] = useState('')
  const [fileName, setFileName] = useState('')
  const [stopAtNodeId, setStopAtNodeId] = useState(RUN_TO_END)
  const [running, setRunning] = useState(false)
  const [result, setResult] = useState<DryRunResult | null>(null)
  const [failure, setFailure] = useState<DryRunError | null>(null)

  const pickFile = async (file: File) => {
    const message = validateFile(file, formats)
    if (message) {
      toast.error('文件不可用', { description: message })
      return
    }
    try {
      const content = await file.text()
      setText(content)
      setFileName(file.name)
      const suffix = file.name.split('.').pop()?.toUpperCase() ?? ''
      if (!TEXT_FORMATS.has(suffix)) {
        toast.warning('该格式可能无法解析为纯文本', {
          description: '试运行只提交文本内容，建议改用 TXT / MARKDOWN / CSV。',
        })
      }
    } catch {
      toast.error('读取文件失败', { description: '请改用下方的示例文本。' })
    }
  }

  const run = async () => {
    setRunning(true)
    setFailure(null)
    setResult(null)
    try {
      const data = await runPipelineDryRun({
        pipelineId,
        dsl,
        ...(text.trim()
          ? { fileText: text, fileName: fileName || 'dry-run-input.txt' }
          : {}),
        ...(stopAtNodeId === RUN_TO_END ? {} : { stopAtNodeId }),
      })
      setResult(data)
      if (data.run.status === 'succeeded') {
        toast.success('试运行通过', {
          description: `${data.run.nodeRuns.length} 个节点执行完成`,
        })
      } else {
        toast.error('试运行未通过', {
          description: data.run.errorMessage ?? '请查看节点明细',
        })
      }
    } catch (error) {
      const next =
        error instanceof DryRunError ? error : new DryRunError('试运行失败')
      setFailure(next)
      toast.error('试运行失败', { description: next.message })
    } finally {
      setRunning(false)
    }
  }

  return (
    <>
      <div className='flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto pe-1'>
        <section className='flex flex-col gap-3 rounded-lg border p-3'>
          <div className='flex flex-wrap items-center justify-between gap-2'>
            <Label className='text-sm'>数据来源</Label>
            <div className='flex items-center gap-2'>
              <input
                ref={fileInputRef}
                type='file'
                className='hidden'
                accept={formats
                  .map((format) => `.${format.toLowerCase()}`)
                  .join(',')}
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  event.target.value = ''
                  if (file) void pickFile(file)
                }}
              />
              <Button
                type='button'
                size='sm'
                variant='outline'
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className='size-4' aria-hidden='true' />
                选择文件
              </Button>
              {fileName ? (
                <span className='max-w-40 truncate text-xs text-muted-foreground'>
                  {fileName}
                </span>
              ) : null}
            </div>
          </div>
          <Textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            rows={4}
            placeholder='粘贴文本，或留空使用后端内置示例文本'
            className='min-h-24 resize-y text-xs'
          />
          <p className='text-xs text-pretty text-muted-foreground'>
            留空时使用内置示例文本；试运行固定不写入正式向量库。
          </p>

          <div className='flex flex-col gap-2'>
            <Label htmlFor='dry-run-stop-at' className='text-sm'>
              执行范围
            </Label>
            <Select value={stopAtNodeId} onValueChange={setStopAtNodeId}>
              <SelectTrigger id='dry-run-stop-at' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={RUN_TO_END}>执行到流程结束</SelectItem>
                {dsl.nodes.map((node) => (
                  <SelectItem key={node.id} value={node.id}>
                    {node.data.label}（{node.data.kind}）
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        {failure ? (
          <IssueBox
            title='试运行失败'
            message={failure.message}
            blocking={failure.blocking}
          />
        ) : null}

        {result ? <DryRunResultView result={result} /> : null}
      </div>

      <DialogFooter className='border-t pt-4'>
        <Button
          type='button'
          onClick={() => void run()}
          disabled={running}
          className='w-full sm:w-auto'
        >
          {running ? (
            <Loader2 className='size-4 animate-spin' aria-hidden='true' />
          ) : (
            <Play className='size-4' aria-hidden='true' />
          )}
          {running ? '执行中…' : '开始试运行'}
        </Button>
      </DialogFooter>
    </>
  )
}

function DryRunResultView({ result }: { result: DryRunResult }) {
  const { run, validation } = result
  const statusLabel = RUN_STATUS_LABELS[run.status] ?? run.status

  return (
    <section className='flex flex-col gap-3'>
      <div className='flex flex-wrap items-center gap-2'>
        <Badge
          variant={
            run.status === 'succeeded'
              ? 'default'
              : run.status === 'failed'
                ? 'destructive'
                : 'secondary'
          }
        >
          {statusLabel}
        </Badge>
        <span className='text-xs text-muted-foreground tabular-nums'>
          进度 {run.progress}%
        </span>
        <span className='truncate rounded bg-muted px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground'>
          {run.runId}
        </span>
        {run.traceId ? (
          <span className='truncate text-[11px] text-muted-foreground'>
            trace: {run.traceId}
          </span>
        ) : null}
      </div>

      {run.errorMessage ? (
        <IssueBox
          title={run.errorCode ?? '运行错误'}
          message={run.errorMessage}
          blocking={[]}
        />
      ) : null}

      {validation.blocking.length ? (
        <IssueGroup title='阻断项' issues={validation.blocking} level='error' />
      ) : null}
      {validation.warnings.length ? (
        <IssueGroup
          title='警告项'
          issues={validation.warnings}
          level='warning'
        />
      ) : null}

      <div className='flex flex-col gap-2'>
        {run.nodeRuns.map((node) => (
          <NodeRunRow key={`${node.nodeId}-${node.attempt}`} node={node} />
        ))}
      </div>
    </section>
  )
}

function NodeRunRow({ node }: { node: DryRunNodeRun }) {
  const label = NODE_STATUS_LABELS[node.status] ?? node.status

  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2',
        node.status === 'failed' && 'border-destructive/30 bg-destructive/5'
      )}
    >
      <div className='flex items-center gap-2'>
        <StatusIcon status={node.status} />
        <span className='min-w-0 flex-1 truncate text-sm font-medium'>
          {node.label || node.nodeId}
        </span>
        <span className='text-xs text-muted-foreground'>{label}</span>
        <span className='text-xs text-muted-foreground tabular-nums'>
          {formatDuration(node.durationMs)}
        </span>
      </div>
      <div className='mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 ps-6 text-[11px] text-muted-foreground'>
        <span className='font-mono'>{node.kind || '—'}</span>
        {node.attempt > 0 ? <span>尝试 {node.attempt} 次</span> : null}
        {node.error?.message ? (
          <span className='text-destructive'>{node.error.message}</span>
        ) : null}
      </div>
      {node.artifacts.map((artifact) => (
        <ArtifactRow key={artifact.artifactId} artifact={artifact} />
      ))}
    </div>
  )
}

function ArtifactRow({ artifact }: { artifact: DryRunArtifact }) {
  const meta = Object.entries(artifact.meta ?? {})
    .filter(
      ([, value]) => value !== null && value !== undefined && value !== ''
    )
    .filter(([, value]) => typeof value !== 'object')
    .slice(0, 5)

  return (
    <div className='ms-6 mt-2 rounded-md bg-muted/50 px-2 py-1.5 text-[11px]'>
      <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
        <Badge variant='outline' className='h-4 px-1 text-[10px]'>
          {artifact.artifactType}
        </Badge>
        <span className='min-w-0 truncate font-medium'>{artifact.name}</span>
        <span className='text-muted-foreground'>
          {formatBytes(artifact.sizeBytes)}
        </span>
      </div>
      {meta.length ? (
        <div className='mt-1 flex flex-wrap gap-x-3 gap-y-1 text-muted-foreground'>
          {meta.map(([key, value]) => (
            <span key={key} className='font-mono'>
              {key}={String(value)}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  )
}

function IssueBox({
  title,
  message,
  blocking,
}: {
  title: string
  message: string
  blocking: DryRunIssue[]
}) {
  return (
    <div className='rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm'>
      <div className='flex items-start gap-2'>
        <CircleAlert className='mt-0.5 size-4 shrink-0 text-destructive' />
        <div className='min-w-0 flex-1'>
          <p className='font-medium'>{title}</p>
          <p className='mt-0.5 text-pretty text-muted-foreground'>{message}</p>
          {blocking.length ? (
            <ul className='mt-1 list-disc space-y-0.5 ps-4 text-xs text-muted-foreground'>
              {blocking.map((issue, index) => (
                <li key={`${issue.code}-${index}`}>{issue.message}</li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>
    </div>
  )
}

function IssueGroup({
  title,
  issues,
  level,
}: {
  title: string
  issues: DryRunIssue[]
  level: 'error' | 'warning'
}) {
  return (
    <div className='space-y-1'>
      <p className='text-xs font-medium text-muted-foreground'>{title}</p>
      {issues.map((issue, index) => (
        <div
          key={`${issue.code}-${index}`}
          className={cn(
            'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
            level === 'error'
              ? 'border-destructive/30 bg-destructive/5'
              : 'border-amber-500/30 bg-amber-500/5'
          )}
        >
          {level === 'error' ? (
            <CircleAlert className='mt-0.5 size-4 shrink-0 text-destructive' />
          ) : (
            <TriangleAlert className='mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400' />
          )}
          <span className='min-w-0 flex-1 text-pretty'>{issue.message}</span>
        </div>
      ))}
    </div>
  )
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'succeeded') {
    return <CircleCheck className='size-4 shrink-0 text-emerald-600' />
  }
  if (status === 'failed') {
    return <XCircle className='size-4 shrink-0 text-destructive' />
  }
  if (status === 'running' || status === 'retrying') {
    return <Loader2 className='size-4 shrink-0 animate-spin text-primary' />
  }
  if (status === 'waiting_review' || status === 'blocked') {
    return (
      <CircleAlert className='size-4 shrink-0 text-amber-600 dark:text-amber-400' />
    )
  }
  return <CircleMinus className='size-4 shrink-0 text-muted-foreground' />
}
