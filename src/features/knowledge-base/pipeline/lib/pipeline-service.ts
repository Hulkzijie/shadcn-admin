import { MarkerType, type Edge } from '@xyflow/react'
import type { FlowNode } from '@/features/flow'
import {
  dataTypeOptions,
  type KnowledgeDataType,
} from '../../data/knowledge-types'
import { createIngestNodeData, isIngestNodeKind } from '../data/ingest-node-registry'
import {
  FAIL_POLICY_LABELS,
  type IngestNodeData,
  type IngestNodeKind,
  type PipelineDsl,
  type PipelineStatus,
  type PipelineTemplate,
  type RetryPolicy,
} from '../data/pipeline-types'

/**
 * 入库编排模板的本地存储键。
 * 当前使用 localStorage 持久化，接入后端时只需替换读写实现。
 */
const PIPELINES_STORAGE_KEY = 'kb-ingest-pipelines'

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

/** 知识增强默认关闭，节点保留在链路中以便随时启用。 */
const DISABLED_BY_DEFAULT: IngestNodeKind[] = ['enrich.entity']

const TEMPLATE_PRESETS: Record<
  KnowledgeDataType,
  { id: string; name: string; description: string }
> = {
  unstructured: {
    id: 'tpl-unstructured',
    name: '标准文档入库',
    description:
      '文章、报告、制度等文本类文件的标准链路：解析、清洗、质量初检、切片去重、向量化、对账与主数据更新。',
  },
  structured: {
    id: 'tpl-structured',
    name: '表格结构化入库',
    description:
      '面向 CSV / Excel 等结构化文本，侧重字段解析、切片与向量化，跳过去重与实体增强。',
  },
  multimodal: {
    id: 'tpl-multimodal',
    name: '图片多模态入库',
    description:
      '面向图片与扫描件，先做 OCR 文字识别，再走清洗、切片、向量化与对账链路。',
  },
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function toNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/** 按数据类型生成默认链路，formats 取创建弹窗的格式白名单。 */
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

function normalizeRetry(value: unknown, base: RetryPolicy): RetryPolicy {
  if (!isRecord(value)) return { ...base }
  return {
    maxAttempts: clamp(
      toNumber(value.maxAttempts, base.maxAttempts),
      0,
      5
    ),
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

const DATA_TYPES = new Set<KnowledgeDataType>(
  dataTypeOptions.map((option) => option.value)
)
const STATUSES = new Set<PipelineStatus>(['draft', 'published', 'archived'])

function normalizePipeline(value: unknown): PipelineTemplate | null {
  if (!isRecord(value)) return null
  if (typeof value.id !== 'string' || !value.id) return null

  const createdAt = toNumber(value.createdAt, Date.now())
  const dataType = DATA_TYPES.has(value.dataType as KnowledgeDataType)
    ? (value.dataType as KnowledgeDataType)
    : 'unstructured'

  return {
    id: value.id,
    tenantId: typeof value.tenantId === 'string' ? value.tenantId : 'default',
    name:
      typeof value.name === 'string' && value.name.trim()
        ? value.name.trim()
        : '未命名编排',
    description: typeof value.description === 'string' ? value.description : '',
    scope: value.scope === 'system' ? 'system' : 'tenant',
    dataType,
    status: STATUSES.has(value.status as PipelineStatus)
      ? (value.status as PipelineStatus)
      : 'draft',
    latestVersion: Math.max(0, toNumber(value.latestVersion, 0)),
    publishedVersion:
      typeof value.publishedVersion === 'number' ? value.publishedVersion : null,
    dsl: normalizeDsl(value.dsl),
    createdAt,
    updatedAt: toNumber(value.updatedAt, createdAt),
  }
}

function readPipelines(): PipelineTemplate[] {
  seedDefaultPipelines()
  try {
    const raw = localStorage.getItem(PIPELINES_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => normalizePipeline(item) ?? [])
  } catch {
    return []
  }
}

function writePipelines(pipelines: PipelineTemplate[]) {
  localStorage.setItem(PIPELINES_STORAGE_KEY, JSON.stringify(pipelines))
}

/** 首次访问时写入三份系统模板；用户清空后不再自动重建。 */
function seedDefaultPipelines() {
  if (localStorage.getItem(PIPELINES_STORAGE_KEY) !== null) return

  const now = Date.now()
  const seeded = (
    Object.keys(TEMPLATE_PRESETS) as KnowledgeDataType[]
  ).map((dataType) => {
    const preset = TEMPLATE_PRESETS[dataType]
    return {
      id: preset.id,
      tenantId: 'default',
      name: preset.name,
      description: preset.description,
      scope: 'system' as const,
      dataType,
      status: 'published' as const,
      latestVersion: 1,
      publishedVersion: 1,
      dsl: buildDefaultDsl(dataType),
      createdAt: now,
      updatedAt: now,
    }
  })

  writePipelines(seeded)
}

/** 只保留需要入库的字段，避免把选中态、测量尺寸写进存储。 */
function toPersistedDsl(dsl: PipelineDsl): PipelineDsl {
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

/** 按更新时间倒序返回全部编排模板。 */
export function listPipelines(): PipelineTemplate[] {
  return readPipelines().sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getPipeline(id: string): PipelineTemplate | undefined {
  return readPipelines().find((pipeline) => pipeline.id === id)
}

export function createPipeline(input: {
  name: string
  description?: string
  dataType: KnowledgeDataType
}): PipelineTemplate {
  const now = Date.now()
  const pipeline: PipelineTemplate = {
    id: crypto.randomUUID(),
    tenantId: 'default',
    name: input.name.trim() || '未命名编排',
    description: input.description?.trim() ?? '',
    scope: 'tenant',
    dataType: input.dataType,
    status: 'draft',
    latestVersion: 0,
    publishedVersion: null,
    dsl: buildDefaultDsl(input.dataType),
    createdAt: now,
    updatedAt: now,
  }

  writePipelines([pipeline, ...readPipelines()])
  return pipeline
}

/** 保存画布数据；返回 undefined 表示编排已不存在。 */
export function savePipelineDsl(
  id: string,
  dsl: PipelineDsl
): PipelineTemplate | undefined {
  let updated: PipelineTemplate | undefined
  const pipelines = readPipelines().map((pipeline) => {
    if (pipeline.id !== id) return pipeline
    updated = {
      ...pipeline,
      dsl: toPersistedDsl(dsl),
      updatedAt: Date.now(),
    }
    return updated
  })

  if (updated) writePipelines(pipelines)
  return updated
}

/** 发布当前已保存的 DSL，生成不可变版本 vN。 */
export function publishPipeline(id: string): PipelineTemplate | undefined {
  let updated: PipelineTemplate | undefined
  const pipelines = readPipelines().map((pipeline) => {
    if (pipeline.id !== id) return pipeline
    const nextVersion = pipeline.latestVersion + 1
    updated = {
      ...pipeline,
      status: 'published',
      latestVersion: nextVersion,
      publishedVersion: nextVersion,
      updatedAt: Date.now(),
    }
    return updated
  })

  if (updated) writePipelines(pipelines)
  return updated
}

export function duplicatePipeline(id: string): PipelineTemplate | undefined {
  const source = getPipeline(id)
  if (!source) return undefined

  const now = Date.now()
  const copy: PipelineTemplate = {
    ...source,
    id: crypto.randomUUID(),
    name: `${source.name} 副本`,
    scope: 'tenant',
    status: 'draft',
    latestVersion: 0,
    publishedVersion: null,
    dsl: structuredClone(source.dsl),
    createdAt: now,
    updatedAt: now,
  }

  writePipelines([copy, ...readPipelines()])
  return copy
}

export function deletePipeline(id: string) {
  writePipelines(readPipelines().filter((pipeline) => pipeline.id !== id))
}
