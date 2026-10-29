import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { FlowCanvas } from '@/features/flow'
import { dataTypeOptions } from '../data/knowledge-types'
import { INGEST_FLOW_REGISTRY } from './data/ingest-node-registry'
import {
  FAIL_POLICY_OPTIONS,
  type IngestNodeData,
  type NodeFailPolicy,
  type PipelineDsl,
  type PipelineTemplate,
} from './data/pipeline-types'
import {
  getPipeline,
  publishPipeline,
  savePipelineDsl,
} from './lib/pipeline-service'
import { validatePipeline } from './lib/validate-pipeline'

export function PipelineEditor({ pipelineId }: { pipelineId: string }) {
  const [pipeline, setPipeline] = useState<PipelineTemplate | undefined>(() =>
    getPipeline(pipelineId)
  )

  if (!pipeline) {
    return (
      <div className='flex h-svh flex-col items-center justify-center gap-4 px-6 text-center'>
        <p className='text-sm text-muted-foreground'>
          该编排不存在或已被删除。
        </p>
        <Button asChild variant='outline'>
          <Link to={'/knowledge-base' as string}>
            <ArrowLeft className='size-4' aria-hidden='true' />
            返回知识库
          </Link>
        </Button>
      </div>
    )
  }

  const dataTypeLabel =
    dataTypeOptions.find((option) => option.value === pipeline.dataType)
      ?.label ?? pipeline.dataType

  const handleSave = (dsl: PipelineDsl) => {
    const next = savePipelineDsl(pipelineId, dsl)
    if (!next) return false
    setPipeline(next)
    return true
  }

  const handlePublish = () => {
    const next = publishPipeline(pipelineId)
    if (!next) {
      toast.error('发布失败', { description: '该编排可能已被删除' })
      return
    }
    setPipeline(next)
    toast.success(`已发布 v${next.latestVersion}`, {
      description: '发布基于最近一次保存的内容。',
    })
  }

  return (
    <FlowCanvas
      title={pipeline.name}
      subtitle={`${dataTypeLabel} · v${pipeline.latestVersion} 已发布 / 最近保存`}
      backTo='/knowledge-base'
      backLabel='返回知识库'
      registry={INGEST_FLOW_REGISTRY}
      initialDsl={pipeline.dsl}
      onSave={handleSave}
      validate={validatePipeline}
      onPublish={handlePublish}
      renderInspectorExtras={(node, update) => (
        <RetrySection data={node.data} update={update} />
      )}
    />
  )
}

type RetrySectionProps = {
  data: IngestNodeData
  update: (patch: Partial<IngestNodeData>) => void
}

/** 节点面板的「失败与重试」区块，对应 PRD 8.3 的第三段。 */
function RetrySection({ data, update }: RetrySectionProps) {
  const patchRetry = (patch: Partial<IngestNodeData['retry']>) =>
    update({ retry: { ...data.retry, ...patch } })

  return (
    <section className='flex flex-col gap-4 border-t pt-4'>
      <p className='text-[11px] font-medium tracking-wide text-muted-foreground uppercase'>
        失败与重试
      </p>

      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <Label htmlFor='node-enabled'>启用节点</Label>
          <p className='mt-1 text-xs text-pretty text-muted-foreground'>
            关闭后该节点不参与执行，也不会触发校验。
          </p>
        </div>
        <Switch
          id='node-enabled'
          checked={data.enabled}
          onCheckedChange={(checked) => update({ enabled: checked })}
        />
      </div>

      <div className='flex flex-col gap-2'>
        <Label htmlFor='node-fail-policy'>失败处理</Label>
        <Select
          value={data.failPolicy}
          onValueChange={(value) =>
            update({ failPolicy: value as NodeFailPolicy })
          }
        >
          <SelectTrigger id='node-fail-policy' className='w-full'>
            <SelectValue placeholder='选择失败处理方式' />
          </SelectTrigger>
          <SelectContent>
            {FAIL_POLICY_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='flex flex-col gap-2'>
        <Label htmlFor='node-max-attempts'>重试次数</Label>
        <Input
          id='node-max-attempts'
          type='number'
          inputMode='numeric'
          min={0}
          max={5}
          value={String(data.retry.maxAttempts)}
          onChange={(event) => {
            const next = Number(event.target.value)
            patchRetry({
              maxAttempts: Number.isFinite(next)
                ? Math.min(5, Math.max(0, next))
                : 0,
            })
          }}
        />
      </div>

      <div className='flex flex-col gap-2'>
        <Label htmlFor='node-retry-interval'>重试间隔</Label>
        <div className='relative'>
          <Input
            id='node-retry-interval'
            type='number'
            inputMode='numeric'
            min={0}
            value={String(data.retry.intervalMs)}
            className='pe-10'
            onChange={(event) => {
              const next = Number(event.target.value)
              patchRetry({
                intervalMs: Number.isFinite(next) ? Math.max(0, next) : 0,
              })
            }}
          />
          <span className='pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-muted-foreground'>
            ms
          </span>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <Label htmlFor='node-backoff'>退避策略</Label>
        <Select
          value={data.retry.backoff}
          onValueChange={(value) =>
            patchRetry({
              backoff: value === 'exponential' ? 'exponential' : 'fixed',
            })
          }
        >
          <SelectTrigger id='node-backoff' className='w-full'>
            <SelectValue placeholder='选择退避策略' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='fixed'>固定间隔</SelectItem>
            <SelectItem value='exponential'>指数退避</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className='flex flex-col gap-2'>
        <Label htmlFor='node-timeout'>单次超时</Label>
        <div className='relative'>
          <Input
            id='node-timeout'
            type='number'
            inputMode='numeric'
            min={0}
            value={String(data.retry.timeoutMs)}
            className='pe-10'
            onChange={(event) => {
              const next = Number(event.target.value)
              patchRetry({
                timeoutMs: Number.isFinite(next) ? Math.max(0, next) : 0,
              })
            }}
          />
          <span className='pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-muted-foreground'>
            ms
          </span>
        </div>
        <p className='text-xs text-pretty text-muted-foreground'>
          0 表示不限制单次执行时长。
        </p>
      </div>

      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <Label htmlFor='node-idempotent'>幂等执行</Label>
          <p className='mt-1 text-xs text-pretty text-muted-foreground'>
            开启后重试不会产生重复写入。
          </p>
        </div>
        <Switch
          id='node-idempotent'
          checked={data.retry.idempotent}
          onCheckedChange={(checked) => patchRetry({ idempotent: checked })}
        />
      </div>
    </section>
  )
}
