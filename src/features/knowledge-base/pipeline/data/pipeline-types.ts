import type { FlowDsl } from '@/features/flow'
import type { KnowledgeDataType } from '../../data/knowledge-types'

/** 入库编排的节点类型，命名规则：域.动作。 */
export type IngestNodeKind =
  | 'input.file'
  | 'guard.precheck'
  | 'parse.document'
  | 'parse.ocr'
  | 'clean.normalize'
  | 'guard.quality'
  | 'split.chunk'
  | 'split.dedupe'
  | 'enrich.entity'
  | 'enrich.summary'
  | 'enrich.keywords'
  | 'compliance.review'
  | 'embed.vector'
  | 'guard.vector'
  | 'store.vector'
  | 'guard.reconcile'
  | 'store.master'
  | 'flow.condition'
  | 'flow.human-review'
  | 'store.version'
  | 'flow.end'

/** 节点失败后的处理动作。 */
export type NodeFailPolicy =
  | 'abort'
  | 'retry_then_abort'
  | 'skip'
  | 'exception_branch'
  | 'manual'

export type RetryPolicy = {
  /** 0-5 次。 */
  maxAttempts: number
  intervalMs: number
  backoff: 'fixed' | 'exponential'
  timeoutMs: number
  idempotent: boolean
}

export type IngestNodeAdvanced = {
  concurrency?: number
  batchSize?: number
  logLevel?: 'error' | 'warn' | 'info' | 'debug'
  artifactRetention?: 'full' | 'meta_only'
}

export type IngestNodeData = {
  kind: IngestNodeKind
  label: string
  description: string
  enabled: boolean
  config: Record<string, unknown>
  failPolicy: NodeFailPolicy
  retry: RetryPolicy
  advanced?: IngestNodeAdvanced
}

/** 编排 DSL，参数只存在于这里，知识库侧仅保存引用与覆盖值。 */
export type PipelineDsl = FlowDsl<IngestNodeData>

export type PipelineScope = 'system' | 'tenant'
export type PipelineStatus = 'draft' | 'published' | 'archived'

export type PipelineTemplate = {
  id: string
  tenantId: string
  name: string
  description: string
  scope: PipelineScope
  dataType: KnowledgeDataType
  status: PipelineStatus
  latestVersion: number
  publishedVersion: number | null
  dsl: PipelineDsl
  createdAt: number
  updatedAt: number
}

/** 知识库与编排模板的绑定关系，表单参数以覆盖值形式存在。 */
export type KnowledgeBaseBinding = {
  kbId: string
  pipelineId: string
  templateVersion: number
  overrides: {
    chunkLength?: number
    preprocessRules?: string
    embeddingModel?: string
    enhancement?: boolean
  }
}

export type NodeRunStatus =
  | 'pending'
  | 'running'
  | 'retrying'
  | 'succeeded'
  | 'failed'
  | 'skipped'
  | 'blocked'

export type NodeRun = {
  nodeId: string
  kind: IngestNodeKind
  label: string
  status: NodeRunStatus
  attempt: number
  durationMs: number | null
  inputArtifactId?: string
  outputArtifactId?: string
  error?: { code: string; message: string; traceId?: string }
  logsUrl?: string
}

export type IngestRunStatus =
  | 'queued'
  | 'running'
  | 'succeeded'
  | 'failed'
  | 'canceled'
  | 'waiting_review'

export type IngestRun = {
  id: string
  batchId?: string
  kbId: string
  fileId: string
  fileName: string
  pipelineId: string
  templateVersion: number
  status: IngestRunStatus
  currentNodeId: string | null
  progress: number
  startedAt: number
  endedAt: number | null
  parentRunId?: string
  nodeRuns: NodeRun[]
}

export const FAIL_POLICY_OPTIONS: Array<{ label: string; value: NodeFailPolicy }> = [
  { label: '中止流程', value: 'abort' },
  { label: '重试后中止', value: 'retry_then_abort' },
  { label: '跳过该文件', value: 'skip' },
  { label: '走异常分支', value: 'exception_branch' },
  { label: '转人工处理', value: 'manual' },
]

export const FAIL_POLICY_LABELS: Record<NodeFailPolicy, string> = {
  abort: '中止流程',
  retry_then_abort: '重试后中止',
  skip: '跳过该文件',
  exception_branch: '走异常分支',
  manual: '转人工处理',
}
