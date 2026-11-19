import { MarkerType, type Edge } from '@xyflow/react'
import { javaClient } from '@/lib/api/java-client'
import type { FlowNode } from '@/features/flow'
import {
  dataTypeOptions,
  type KnowledgeDataType,
} from '../../data/knowledge-types'
import {
  createIngestNodeData,
  isIngestNodeKind,
} from '../data/ingest-node-registry'
import {
  FAIL_POLICY_LABELS,
  type IngestNodeData,
  type IngestNodeKind,
  type PipelineDsl,
  type PipelineStatus,
  type PipelineTemplate,
  type PipelineVersion,
  type RetryPolicy,
} from '../data/pipeline-types'

/* ------------------------------------------------------------------ */
/* RuoYi 响应结构                                                       */
/* ------------------------------------------------------------------ */

interface RuoYiR<T> {
  code: number
  msg: string
  data: T
}

interface RuoYiTable<T> {
  code: number
  msg: string
  rows: T[]
  total: number
}

/** 请求单对象接口，返回 data */
async function request<T>(config: {
  url: string
  method: string
  data?: unknown
  params?: unknown
}): Promise<T> {
  const res = await javaClient.request<RuoYiR<T>>(config)
  const body = res.data
  if (body && typeof body.code === 'number' && body.code !== 200) {
    throw new Error(body.msg || `请求失败（${body.code}）`)
  }
  return body.data
}

/** 请求分页列表接口，返回 rows 数组 */
async function requestRows<T>(config: {
  url: string
  method: string
  params?: unknown
}): Promise<T[]> {
  const res = await javaClient.request<RuoYiTable<T>>(config)
  const body = res.data
  if (body && typeof body.code === 'number' && body.code !== 200) {
    throw new Error(body.msg || `请求失败（${body.code}）`)
  }
  return Array.isArray(body?.rows) ? body.rows : []
}

/* ------------------------------------------------------------------ */
/* 后端 VO 类型（与 Java KbPipelineVo 对应）                             */
/* ------------------------------------------------------------------ */

interface KbPipelineVo {
  id: number
  name: string
  description?: string
  scope: string
  dataType: string
  status: string
  latestVersion?: number
  publishedVersion?: number | null
  sourceTemplateId?: number | null
  dsl?: Record<string, unknown> | null
  createTime?: string | null
  updateTime?: string | null
}

interface KbPipelineVersionVo {
  id?: number
  pipelineId?: number
  version: number
  dsl?: Record<string, unknown> | null
  note?: string | null
  publishedTime?: string | null
}

/* ------------------------------------------------------------------ */
/* DSL 构建（新建时生成默认链路）                                         */
/* ------------------------------------------------------------------ */

/** 每个数据类型的默认链路，与 PRD 第 21 节保持一致。 */
const DEFAULT_CHAINS: Record<KnowledgeDataType, IngestNodeKind[]> = {
  unstructured: [
    'input.file',
    'guard.precheck',
    'parse.document',
    'clean.normalize',
    'guard.quality',
    'split.chunk',
    'split.dedupe',
    'enrich.entity',
    'embed.vector',
    'guard.vector',
    'store.vector',
    'guard.reconcile',
    'store.master',
    'flow.end',
  ],
  structured: [
    'input.file',
    'guard.precheck',
    'parse.document',
    'clean.normalize',
    'guard.quality',
    'split.chunk',
    'embed.vector',
    'guard.vector',
    'store.vector',
    'guard.reconcile',
    'store.master',
    'flow.end',
  ],
  multimodal: [
    'input.file',
    'guard.precheck',
    'parse.ocr',
    'clean.normalize',
    'guard.quality',
    'split.chunk',
    'split.dedupe',
    'enrich.entity',
    'embed.vector',
    'guard.vector',
    'store.vector',
    'guard.reconcile',
    'store.master',
    'flow.end',
  ],
}

/** 知识增强默认关闭 */
const DISABLED_BY_DEFAULT: IngestNodeKind[] = ['enrich.entity']

/** 按数据类型生成默认链路 */
function buildDefaultDsl(dataType: KnowledgeDataType): PipelineDsl {
  const formats =
    dataTypeOptions
      .find((option) => option.value === dataType)
      ?.formats.join(', ') ?? ''

  const nodes: FlowNode<IngestNodeData>[] = DEFAULT_CHAINS[dataType].map(
    (kind, index) => {
      const data = createIngestNodeData(
        kind,
        kind === 'input.file' ? { config: { formats } } : undefined
      )
      return {
        id: kind,
        type: 'flow',
        position: { x: 40 + index * 300, y: 200 },
        data: {
          ...data,
          enabled: !DISABLED_BY_DEFAULT.includes(kind),
        },
      }
    }
  )

  const edges: Edge[] = nodes.slice(1).map((node, index) => ({
    id: `${nodes[index].id}->${node.id}`,
    source: nodes[index].id,
    target: node.id,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { strokeWidth: 1.5 },
  }))

  return { nodes, edges }
}

/* ------------------------------------------------------------------ */
/* DSL 序列化 / 反序列化                                                 */
/* ------------------------------------------------------------------ */

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function normalizeRetry(value: unknown, base: RetryPolicy): RetryPolicy {
  if (!isRecord(value)) return { ...base }
  return {
    maxAttempts: clamp(toNumber(value.maxAttempts, base.maxAttempts), 0, 5),
    intervalMs: Math.max(0, toNumber(value.intervalMs, base.intervalMs)),
    backoff: value.backoff === 'exponential' ? 'exponential' : 'fixed',
    timeoutMs: Math.max(0, toNumber(value.timeoutMs, base.timeoutMs)),
    idempotent: value.idempotent !== false,
  }
}

function normalizeNode(value: unknown): FlowNode<IngestNodeData> | null {
  if (!isRecord(value)) return null
  const position = value.position
  const raw = value.data

  if (typeof value.id !== 'string' || !value.id) return null
  if (!isRecord(position)) return null
  const x = position.x
  const y = position.y
  if (typeof x !== 'number' || typeof y !== 'number') return null
  if (!isRecord(raw)) return null
  if (typeof raw.kind !== 'string' || !isIngestNodeKind(raw.kind)) return null

  const base = createIngestNodeData(raw.kind)

  return {
    id: value.id,
    type: 'flow',
    position: { x, y },
    data: {
      ...base,
      label:
        typeof raw.label === 'string' && raw.label ? raw.label : base.label,
      description:
        typeof raw.description === 'string'
          ? raw.description
          : base.description,
      enabled: raw.enabled !== false,
      config: {
        ...base.config,
        ...(isRecord(raw.config) ? raw.config : {}),
      },
      failPolicy:
        typeof raw.failPolicy === 'string' &&
        raw.failPolicy in FAIL_POLICY_LABELS
          ? (raw.failPolicy as IngestNodeData['failPolicy'])
          : base.failPolicy,
      retry: normalizeRetry(raw.retry, base.retry),
      advanced: isRecord(raw.advanced)
        ? (raw.advanced as IngestNodeData['advanced'])
        : undefined,
    },
  }
}

function normalizeEdge(value: unknown): Edge | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'string' || !value.id) return null
  if (typeof value.source !== 'string' || !value.source) return null
  if (typeof value.target !== 'string' || !value.target) return null

  return {
    id: value.id,
    source: value.source,
    target: value.target,
    type: 'smoothstep',
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { strokeWidth: 1.5 },
  }
}

function normalizeDsl(value: unknown): PipelineDsl {
  if (!isRecord(value)) return { nodes: [], edges: [] }
  return {
    nodes: Array.isArray(value.nodes)
      ? value.nodes.flatMap((node) => normalizeNode(node) ?? [])
      : [],
    edges: Array.isArray(value.edges)
      ? value.edges.flatMap((edge) => normalizeEdge(edge) ?? [])
      : [],
  }
}

function normalizeVersions(value: unknown): PipelineVersion[] {
  if (!Array.isArray(value)) return []
  return value
    .flatMap((item) => {
      if (!isRecord(item)) return []
      const version = toNumber(item.version, 0)
      if (version <= 0) return []
      return [
        {
          version,
          dsl: normalizeDsl(item.dsl),
          publishedAt: item.publishedTime
            ? new Date(item.publishedTime as string).getTime()
            : toNumber(item.publishedAt, 0),
        },
      ]
    })
    .sort((a, b) => a.version - b.version)
}

/** 将后端 KbPipelineVo 映射为前端 PipelineTemplate */
function voToPipeline(vo: KbPipelineVo): PipelineTemplate {
  const idStr = String(vo.id)
  const dataType = (['unstructured', 'structured', 'multimodal'] as const).includes(
    vo.dataType as KnowledgeDataType
  )
    ? (vo.dataType as KnowledgeDataType)
    : 'unstructured'

  const statuses = new Set<PipelineStatus>(['draft', 'published', 'archived'])
  const status = statuses.has(vo.status as PipelineStatus)
    ? (vo.status as PipelineStatus)
    : 'draft'

  const dsl = normalizeDsl(vo.dsl)
  const latestVersion = Math.max(0, toNumber(vo.latestVersion, 0))
  const createdAt = vo.createTime ? new Date(vo.createTime).getTime() : Date.now()
  const updatedAt = vo.updateTime ? new Date(vo.updateTime).getTime() : createdAt

  return {
    id: idStr,
    tenantId: 'default',
    name: vo.name?.trim() || '未命名编排',
    description: vo.description ?? '',
    scope: vo.scope === 'system' ? 'system' : 'tenant',
    dataType,
    status,
    latestVersion,
    publishedVersion: vo.publishedVersion ?? null,
    versions: [],
    dsl,
    createdAt,
    updatedAt,
  }
}

/** 只保留需要入库的字段，避免把选中态、测量尺寸写进存储。 */
function toPersistedDsl(dsl: PipelineDsl): Record<string, unknown> {
  return {
    nodes: dsl.nodes.map((node) => ({
      id: node.id,
      type: 'flow',
      position: { x: node.position.x, y: node.position.y },
      data: { ...node.data },
    })),
    edges: dsl.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { strokeWidth: 1.5 },
    })),
  }
}

/* ------------------------------------------------------------------ */
/* 公开 API                                                             */
/* ------------------------------------------------------------------ */

/** 按更新时间倒序返回全部编排模板（本租户 + 系统模板）。 */
export async function listPipelines(): Promise<PipelineTemplate[]> {
  const rows = await requestRows<KbPipelineVo>({
    url: '/ai/kb-pipelines',
    method: 'get',
    params: { pageNum: 1, pageSize: 200 },
  })
  return rows.map(voToPipeline).sort((a, b) => b.updatedAt - a.updatedAt)
}

export async function getPipeline(id: string): Promise<PipelineTemplate | undefined> {
  try {
    const vo = await request<KbPipelineVo>({
      url: `/ai/kb-pipelines/${encodeURIComponent(id)}`,
      method: 'get',
    })
    if (!vo) return undefined
    return voToPipeline(vo)
  } catch {
    return undefined
  }
}

export async function createPipeline(input: {
  name: string
  description?: string
  dataType: KnowledgeDataType
}): Promise<PipelineTemplate> {
  const dsl = buildDefaultDsl(input.dataType)
  const newId = await request<number>({
    url: '/ai/kb-pipelines',
    method: 'post',
    data: {
      name: input.name.trim() || '未命名编排',
      description: input.description?.trim() ?? '',
      dataType: input.dataType,
      scope: 'tenant',
      dsl: toPersistedDsl(dsl),
    },
  })
  // 返回新建的完整模板（从 id 重新查询）
  const created = await getPipeline(String(newId))
  if (created) return created
  // 兜底：本地构造（通常不会到这里）
  const now = Date.now()
  return {
    id: String(newId),
    tenantId: 'default',
    name: input.name.trim() || '未命名编排',
    description: input.description?.trim() ?? '',
    scope: 'tenant',
    dataType: input.dataType,
    status: 'draft',
    latestVersion: 0,
    publishedVersion: null,
    versions: [],
    dsl,
    createdAt: now,
    updatedAt: now,
  }
}

/** 保存画布数据。返回 undefined 表示编排已不存在。 */
export async function savePipelineDsl(
  id: string,
  dsl: PipelineDsl
): Promise<PipelineTemplate | undefined> {
  const current = await getPipeline(id)
  if (!current) return undefined

  await request<void>({
    url: `/ai/kb-pipelines/${encodeURIComponent(id)}`,
    method: 'put',
    data: {
      name: current.name,
      description: current.description,
      dataType: current.dataType,
      dsl: toPersistedDsl(dsl),
    },
  })
  return { ...current, dsl, updatedAt: Date.now() }
}

/** 发布当前已保存的 DSL，生成不可变版本 vN。 */
export async function publishPipeline(id: string): Promise<PipelineTemplate | undefined> {
  try {
    const vo = await request<KbPipelineVo>({
      url: `/ai/kb-pipelines/${encodeURIComponent(id)}/publish`,
      method: 'post',
      data: {},
    })
    if (!vo) return undefined
    return voToPipeline(vo)
  } catch {
    return undefined
  }
}

export async function duplicatePipeline(id: string): Promise<PipelineTemplate | undefined> {
  const source = await getPipeline(id)
  if (!source) return undefined

  const newId = await request<number>({
    url: '/ai/kb-pipelines',
    method: 'post',
    data: {
      name: `${source.name} 副本`,
      description: source.description,
      dataType: source.dataType,
      scope: 'tenant',
      fromTemplateId: Number(id),
      dsl: toPersistedDsl(source.dsl),
    },
  })
  return getPipeline(String(newId))
}

export async function deletePipeline(id: string): Promise<void> {
  await request<void>({
    url: `/ai/kb-pipelines/${encodeURIComponent(id)}`,
    method: 'delete',
  })
}

/** 获取版本列表（带完整 DSL 快照）。 */
export async function listPipelineVersions(id: string): Promise<PipelineVersion[]> {
  const versions = await request<KbPipelineVersionVo[]>({
    url: `/ai/kb-pipelines/${encodeURIComponent(id)}/versions`,
    method: 'get',
  })
  if (!Array.isArray(versions)) return []
  return normalizeVersions(versions)
}
