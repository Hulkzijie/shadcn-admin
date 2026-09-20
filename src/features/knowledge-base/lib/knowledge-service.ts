import { fastapiClient } from '@/lib/api/fastapi-client'
import {
  type CreateKnowledgeBaseInput,
  type IngestNode,
  type IngestNodeStatus,
  type IngestTask,
  type KnowledgeBaseItem,
  type UploadedFile,
  MAX_FILE_COUNT,
  MAX_FILE_SIZE,
} from '../data/knowledge-types'

/**
 * 校验文件是否符合上传规则。
 * @param file 待校验文件
 * @param allowedExtensions 允许的扩展名（不含点号，忽略大小写）
 * @returns 错误信息；通过校验时返回 null
 */
export function validateFile(
  file: File,
  allowedExtensions: string[]
): string | null {
  const ext = file.name.split('.').pop()?.toUpperCase() ?? ''
  if (!allowedExtensions.includes(ext)) {
    return `不支持 ${ext || '未知'} 格式`
  }
  if (file.size > MAX_FILE_SIZE) {
    return `文件大小不能超过 15MB`
  }
  return null
}

/**
 * 在已选文件之上继续追加新文件，应用格式 / 大小 / 数量限制。
 * @returns { accepted, errors } accepted 为合法的新增文件，errors 为被拒绝项的提示
 */
export function filterFiles(
  files: File[],
  currentCount: number,
  allowedExtensions: string[]
): { accepted: File[]; errors: string[] } {
  const accepted: File[] = []
  const errors: string[] = []

  for (const file of files) {
    if (accepted.length + currentCount >= MAX_FILE_COUNT) {
      errors.push(`最多同时上传 ${MAX_FILE_COUNT} 个文件`)
      break
    }
    const error = validateFile(file, allowedExtensions)
    if (error) {
      errors.push(`${file.name}：${error}`)
    } else {
      accepted.push(file)
    }
  }

  return { accepted, errors }
}

/** 从对象中按候选字段名取第一个非空值，用于兼容后端不同的命名风格 */
function pick(source: unknown, keys: string | string[]): unknown {
  if (!source || typeof source !== 'object') return undefined
  const list = Array.isArray(keys) ? keys : [keys]
  for (const key of list) {
    const value = (source as Record<string, unknown>)[key]
    if (value !== undefined && value !== null && value !== '') return value
  }
  return undefined
}

function pickString(
  source: unknown,
  keys: string | string[]
): string | undefined {
  const value = pick(source, keys)
  return typeof value === 'string' && value.length > 0 ? value : undefined
}

function pickNumber(
  source: unknown,
  keys: string | string[]
): number | undefined {
  const value = pick(source, keys)
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string' && !Number.isNaN(Number(value))) {
    return Number(value)
  }
  return undefined
}

function getResponseId(data: unknown): string {
  const payload = Array.isArray(data) ? data[0] : data
  return (
    pickString(payload, 'id') ??
    pickString(payload, 'fileId') ??
    pickString(payload, 'file_id') ??
    crypto.randomUUID()
  )
}

/**
 * 上传单个文件：POST /py-api/upload（multipart/form-data）。
 * 由弹窗在「选择文件」时调用，返回后端持久化后的文件信息。
 */
export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await fastapiClient.post('/upload', formData)

  return {
    id: getResponseId(data),
    name: pickString(data, 'name') ?? file.name,
    size: file.size,
    url: pickString(data, 'url'),
  }
}

/**
 * 创建知识库：POST /py-api/knowledge-base（JSON）。
 * 文件已在「选择文件」阶段上传完成，这里只提交元数据与文件 id。
 */
export async function createKnowledgeBase(
  input: CreateKnowledgeBaseInput
): Promise<KnowledgeBaseItem> {
  const { data } = await fastapiClient.post('/knowledge-base', {
    name: input.name,
    description: input.description,
    dataType: input.dataType,
    segmentMode: input.segmentMode,
    segmentLength: input.segmentLength,
    preprocessRules: input.preprocessRules,
    enhancement: input.enhancement,
    embeddingModel: input.embeddingModel,
    fileIds: input.fileIds,
  })

  return {
    id: getResponseId(data),
    name: input.name,
    description: input.description,
    dataType: input.dataType,
    fileCount: input.fileIds.length,
    segmentMode: input.segmentMode,
    enhancement: input.enhancement,
    createdAt: Date.now(),
  }
}

const DONE_KEYWORDS = [
  'done',
  'success',
  'succeeded',
  'completed',
  'complete',
  'finished',
  'ok',
]
const RUNNING_KEYWORDS = [
  'running',
  'processing',
  'in_progress',
  'inprogress',
  'doing',
  'started',
  'executing',
]
const ERROR_KEYWORDS = ['error', 'failed', 'fail', 'failure', 'exception']
const PENDING_KEYWORDS = ['pending', 'waiting', 'queued', 'todo', 'created']

function normalizeStatus(
  value: unknown,
  fallback: IngestNodeStatus
): IngestNodeStatus {
  if (typeof value !== 'string') return fallback
  const key = value.toLowerCase()
  if (DONE_KEYWORDS.includes(key)) return 'done'
  if (RUNNING_KEYWORDS.includes(key)) return 'running'
  if (ERROR_KEYWORDS.includes(key)) return 'error'
  if (PENDING_KEYWORDS.includes(key)) return 'pending'
  return fallback
}

function normalizeNode(raw: unknown): IngestNode {
  return {
    name:
      pickString(raw, ['name', 'label', 'title', 'nodeName', 'node_name']) ??
      '未命名节点',
    status: normalizeStatus(pick(raw, ['status', 'state']), 'pending'),
    durationMs:
      pickNumber(raw, [
        'durationMs',
        'duration_ms',
        'duration',
        'costMs',
        'cost_ms',
        'elapsedMs',
        'elapsed_ms',
      ]) ?? null,
  }
}

function normalizeTask(raw: unknown, index: number): IngestTask {
  const nodesRaw = pick(raw, [
    'nodes',
    'steps',
    'children',
    'nodeList',
    'node_list',
  ])
  const nodes = Array.isArray(nodesRaw) ? nodesRaw.map(normalizeNode) : []
  const doneCount = nodes.filter((node) => node.status === 'done').length
  const derivedProgress =
    nodes.length > 0 ? Math.round((doneCount / nodes.length) * 100) : 0
  const derivedElapsed = nodes.reduce(
    (sum, node) => sum + (node.durationMs ?? 0),
    0
  )

  return {
    id: pickString(raw, ['id', 'taskId', 'task_id']) ?? `task-${index}`,
    fileName:
      pickString(raw, ['fileName', 'file_name', 'filename', 'name', 'title']) ??
      '未命名文件',
    fileSize: pickNumber(raw, ['fileSize', 'file_size', 'size']) ?? 0,
    status: normalizeStatus(pick(raw, ['status', 'state']), 'pending'),
    progress:
      pickNumber(raw, ['progress', 'percent', 'percentage', 'rate', 'ratio']) ??
      derivedProgress,
    elapsedMs:
      pickNumber(raw, [
        'elapsedMs',
        'elapsed_ms',
        'elapsedTime',
        'elapsed',
        'totalCostMs',
        'total_cost_ms',
      ]) ?? derivedElapsed,
    nodes,
  }
}

/**
 * 查询知识库下各文件的入库任务：GET /py-api/knowledge-base/{id}/ingest-tasks。
 * 响应支持直接返回数组，或包在 { tasks } / { items } / { list } / { data } 中。
 */
export async function fetchIngestTasks(
  knowledgeBaseId: string
): Promise<IngestTask[]> {
  const { data } = await fastapiClient.get(
    `/knowledge-base/${knowledgeBaseId}/ingest-tasks`
  )
  const list = Array.isArray(data)
    ? data
    : pick(data, ['tasks', 'items', 'list', 'data'])
  if (!Array.isArray(list)) return []
  return list.map((item, index) => normalizeTask(item, index))
}

/**
 * 格式化耗时，如 45s、3m46s。
 */
export function formatDuration(ms: number): string {
  if (ms <= 0) return '0s'
  if (ms < 1000) return `${ms}ms`
  const totalSeconds = Math.round(ms / 1000)
  if (totalSeconds < 60) return `${totalSeconds}s`
  const minutes = Math.floor(totalSeconds / 60)
  return `${minutes}m${totalSeconds % 60}s`
}

/**
 * 格式化文件大小，如 1.2 MB。
 */
export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  )
  return `${(bytes / 1024 ** i).toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}
