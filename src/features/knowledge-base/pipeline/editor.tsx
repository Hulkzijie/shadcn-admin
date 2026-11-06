import { useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Copy, History } from 'lucide-react'
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
import { DryRunButton } from './components/dry-run-panel'
import { INGEST_FLOW_REGISTRY } from './data/ingest-node-registry'
import {
  FAIL_POLICY_OPTIONS,
  type IngestNodeData,
  type NodeFailPolicy,
  type PipelineDsl,
  type PipelineTemplate,
} from './data/pipeline-types'
import {
  duplicatePipeline,
  getPipeline,
  publishPipeline,
  savePipelineDsl,
} from './lib/pipeline-service'
import { validatePipeline } from './lib/validate-pipeline'

/** 版本下拉里代表「当前草稿」的哨兵值。 */
const CURRENT_VERSION = 'current'

export function PipelineEditor({ pipelineId }: { pipelineId: string }) {
  const navigate = useNavigate()
  const [pipeline, setPipeline] = useState<PipelineTemplate | undefined>(() =>
    getPipeline(pipelineId)
  )
  const [previewVersion, setPreviewVersion] = useState<number | null>(null)

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
  // 系统模板只读，历史版本预览同样只读。
  const isSystem = pipeline.scope === 'system'
  const previewing = previewVersion !== null
  const readOnly = isSystem || previewing
  const activeVersion = previewing
    ? pipeline.versions.find((item) => item.version === previewVersion)
    : undefined

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
    setPreviewVersion(null)
    toast.success(`已发布 v${next.latestVersion}`, {
      description: '发布基于最近一次保存的内容。',
    })
  }

  const handleDuplicate = () => {
    const copy = duplicatePipeline(pipelineId)
    if (!copy) {
      toast.error('创建副本失败', { description: '该编排可能已被删除' })
      return
    }
    toast.success('已生成副本', {
      description: `${copy.name} 未绑定知识库，可直接编辑后发布。`,
    })
    void navigate({
      to: '/knowledge-base/pipelines/$pipelineId',
      params: { pipelineId: copy.id },
    })
  }

  const versionSelect = (
    <div className='flex items-center gap-1.5'>
      <History
        className='size-4 shrink-0 text-muted-foreground'
        aria-hidden='true'
      />
      <Select
        value={previewing ? String(previewVersion) : CURRENT_VERSION}
        disabled={pipeline.versions.length === 0}
        onValueChange={(value) =>
          setPreviewVersion(value === CURRENT_VERSION ? null : Number(value))
        }
      >
        <SelectTrigger
          size='sm'
          className='w-32 sm:w-40'
          aria-label='查看历史版本'
        >
          <SelectValue placeholder='暂无版本' />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={CURRENT_VERSION}>
            {isSystem ? '系统模板 v' : '当前草稿'}
            {isSystem ? pipeline.latestVersion : ''}
          </SelectItem>
          {[...pipeline.versions].reverse().map((version) => (
            <SelectItem key={version.version} value={String(version.version)}>
              v{version.version}
              {version.version === pipeline.publishedVersion
                ? '（已发布）'
                : ''}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )

  return (
    <FlowCanvas
      key={`${pipeline.id}-${previewVersion ?? CURRENT_VERSION}`}
      title={pipeline.name}
      subtitle={
        previewing
          ? `正在预览历史版本 v${previewVersion}，切换到「${isSystem ? '系统模板' : '当前草稿'}」可返回`
          : `${dataTypeLabel} · ${isSystem ? '系统模板' : '本知识库编排'} · v${pipeline.latestVersion}`
      }
      backTo='/knowledge-base'
      backLabel='返回知识库'
      registry={INGEST_FLOW_REGISTRY}
      initialDsl={activeVersion?.dsl ?? pipeline.dsl}
      readOnly={readOnly}
      onSave={handleSave}
      validate={validatePipeline}
      onPublish={handlePublish}
      headerActions={({ dsl }) => (
        <>
          {versionSelect}
          <DryRunButton
            pipelineId={pipeline.id}
            dsl={dsl}
            dataType={pipeline.dataType}
          />
          {isSystem ? (
            <Button
              type='button'
              size='sm'
              variant='outline'
              onClick={handleDuplicate}
              className='px-2 sm:px-3'
            >
              <Copy className='size-4' aria-hidden='true' />
              <span className='hidden sm:inline'>基于此模板创建</span>
            </Button>
          ) : null}
        </>
      )}
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
