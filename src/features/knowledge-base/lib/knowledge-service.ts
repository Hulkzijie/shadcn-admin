import { type AxiosRequestConfig } from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import { javaClient } from '@/lib/api/java-client'
import {
  type CreateKnowledgeBaseInput,
  type IngestNode,
  type IngestNodeStatus,
  type IngestTask,
  type IngestTaskSummary,
  type KnowledgeBaseItem,
  type KnowledgeDataType,
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

/** RuoYi 统一响应结构 */
interface RuoYiResponse<T> {
  code: number
  msg: string
  data: T
}

/** 请求 Java 桥接层接口，成功时返回 data；业务错误（code !== 200）抛出异常。 */
async function request<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await javaClient.request<RuoYiResponse<T>>(config)
  const body = res.data
  if (body && typeof body.code === 'number' && body.code !== 200) {
    throw new Error(body.msg || `请求失败（${body.code}）`)
  }
  return body?.data
}

/**
 * 请求分页列表接口：RuoYi 的 TableDataInfo 把 rows 放在响应顶层，
 * 没有 data 包装，因此不能复用 request<T>。
 */
async function requestRows<T>(config: AxiosRequestConfig): Promise<T[]> {
  const res = await javaClient.request<RuoYiResponse<unknown> & { rows?: T[] }>(
    config
  )
  const body = res.data
  if (body && typeof body.code === 'number' && body.code !== 200) {
    throw new Error(body.msg || `请求失败（${body.code}）`)
  }
  return Array.isArray(body?.rows) ? body.rows : []
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

/**
 * 提取 ID 并保留字符串形态。
 * 雪花 ID 有 19 位，超过 Number.MAX_SAFE_INTEGER，转成数字会丢失精度
 * （如 2123253601697533954 → 2123253601697534000），导致按 ID 查询 404。
 */
function pickId(
  source: unknown,
  keys: string | string[]
): string | undefined {
  const value = pick(source, keys)
  if (typeof value === 'string' && value.length > 0) return value
  if (typeof value === 'number' && Number.isFinite(value)) return String(value)
  return undefined
}

/* ------------------------------------------------------------------ */
/* 本地存储：上传文件映射（KB 元数据已切换至 Java API）                 */
/* ------------------------------------------------------------------ */

function currentUserId(): string {
  const userId = useAuthStore.getState().auth.user?.userId
  return userId === undefined || userId === null ? 'anonymous' : String(userId)
}

function fileStorageKey() {
  return `wisecloud:kb-files:v1:${currentUserId()}`
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as unknown
    return (parsed ?? fallback) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage 不可用时静默忽略
  }
}

/** 上传结果缓存：fileId → 对象存储地址与原始文件名，提交入库时使用 */
type CachedFile = { name: string; url: string }
type FileCache = Record<string, CachedFile>

function readFileCache(): FileCache {
  return readJson<FileCache>(fileStorageKey(), {})
}

function rememberFile(fileId: string, file: CachedFile) {
  const cache = readFileCache()
  cache[fileId] = file
  writeJson(fileStorageKey(), cache)
}

/**
 * 上传单个文件：POST /resource/oss/upload（multipart/form-data）。
 * 返回的 id 即后续提交入库时定位对象存储地址的键。
 */
export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData()
  formData.append('file', file)

  const data = await request<Record<string, unknown>>({
    url: '/resource/oss/upload',
    method: 'post',
    data: formData,
  })

  const url = pickString(data, 'url')
  if (!url) throw new Error('上传响应中缺少文件地址')

  const id = pickString(data, ['ossId', 'oss_id']) ?? url
  const name = pickString(data, ['fileName', 'originalName']) ?? file.name
  rememberFile(id, { name, url })

  return { id, name, size: file.size, url }
}

/**
 * 创建知识库：调用 Java API 写入元数据。
 * 文件已在「选择文件」阶段上传完成，入库由 importFiles 提交。
 */
export async function createKnowledgeBase(
  input: CreateKnowledgeBaseInput
): Promise<KnowledgeBaseItem> {
  // Java POST /ai/knowledge-base 返回 R<Long>，data 字段即新建 ID（数字）
  const rawId = await request<unknown>({
    url: '/ai/knowledge-base',
    method: 'post',
    data: {
      name: input.name,
      description: input.description,
      dataType: input.dataType,
      segmentMode: input.segmentMode,
      enhancement: input.enhancement,
    },
  })

  const id = rawId !== null && rawId !== undefined ? String(rawId) : undefined
  if (!id) throw new Error('创建知识库响应中缺少 ID')

  return {
    id,
    name: input.name,
    description: input.description,
    dataType: input.dataType,
    fileIds: input.fileIds,
    ingestTasks: [],
    fileCount: input.fileIds.length,
    segmentMode: input.segmentMode,
    enhancement: input.enhancement,
    createdAt: Date.now(),
  }
}

/**
 * 提交文件入库：逐个调用 POST /ai/kb/{kbId}/documents，
 * 后端返回的 taskId（即 runId）用于轮询入库进度。
 */
export async function importFiles(
  kbId: string,
  fileIds: string[]
): Promise<IngestTaskSummary[]> {
  const cache = readFileCache()

  const tasks = await Promise.all(
    fileIds.map(async (fileId) => {
      const cached = cache[fileId]
      if (!cached) throw new Error('文件上传信息已失效，请重新上传后再创建')

      const data = await request<Record<string, unknown>>({
        url: `/ai/kb/${encodeURIComponent(kbId)}/documents`,
        method: 'post',
        data: {
          fileName: cached.name,
          fileUrl: cached.url,
          fileType: cached.name.split('.').pop()?.toLowerCase() ?? '',
        },
      })

      const taskId = pickString(data, ['taskId', 'runId'])
      if (!taskId) throw new Error('入库响应中缺少任务 ID')

      return {
        taskId,
        fileId,
        fileName: pickString(data, 'fileName') ?? cached.name,
        status: normalizeRunStatus(pick(data, 'status')),
      }
    })
  )

  return tasks
}

const DATA_TYPES: KnowledgeDataType[] = [
  'unstructured',
  'structured',
  'multimodal',
]

function normalizeDataType(value: unknown): KnowledgeDataType {
  return DATA_TYPES.includes(value as KnowledgeDataType)
    ? (value as KnowledgeDataType)
    : 'unstructured'
}

function normalizeKnowledgeBase(
  raw: unknown,
  index: number
): KnowledgeBaseItem {
  return {
    id: pickId(raw, 'id') ?? `kb-${index}`,
    name: pickString(raw, 'name') ?? '未命名知识库',
    description: pickString(raw, 'description') ?? '',
    dataType: normalizeDataType(pick(raw, 'dataType')),
    fileIds: [],
    ingestTasks: [],
    fileCount: pickNumber(raw, 'fileCount') ?? 0,
    segmentMode: pick(raw, 'segmentMode') === 'custom' ? 'custom' : 'auto',
    enhancement: Boolean(pick(raw, 'enhancement')),
    createdAt: pickNumber(raw, ['createTime']) ?? Date.now(),
  }
}


/** 查询知识库列表（Java API，分页取全量前 200 条） */
export async function fetchKnowledgeBases(): Promise<KnowledgeBaseItem[]> {
  const rows = await requestRows<unknown>({
    url: '/ai/knowledge-base',
    method: 'get',
    params: { pageNum: 1, pageSize: 200 },
  })
  return rows.map((item, index) => normalizeKnowledgeBase(item, index))
}

/** 删除知识库（Java API） */
export async function deleteKnowledgeBase(id: string): Promise<void> {
  await request<unknown>({
    url: `/ai/knowledge-base/${encodeURIComponent(id)}`,
    method: 'delete',
  })
}

/**
 * 绑定知识库与编排模板。
 * PUT /ai/knowledge-base/{kbId}/pipeline
 * @param kbId       知识库 ID（字符串）
 * @param pipelineId 编排模板 ID（数字）
 */
export async function bindPipeline(kbId: string, pipelineId: number): Promise<void> {
  await request<unknown>({
    url: `/ai/knowledge-base/${encodeURIComponent(kbId)}/pipeline`,
    method: 'put',
    data: { pipelineId },
  })
}

/* ------------------------------------------------------------------ */
/* 入库进度                                                            */
/* ------------------------------------------------------------------ */

const DONE_KEYWORDS = ['succeeded', 'success', 'done', 'completed', 'skipped']
const RUNNING_KEYWORDS = [
  'running',
  'retrying',
  'processing',
  'in_progress',
  'waiting_review',
  'executing',
]
const ERROR_KEYWORDS = [
  'failed',
  'failure',
  'blocked',
  'canceled',
  'cancelled',
  'error',
]

/** 后端运行 / 节点状态 → 前端四态 */
function normalizeRunStatus(value: unknown): IngestNodeStatus {
  if (typeof value !== 'string') return 'pending'
  const key = value.toLowerCase()
  if (DONE_KEYWORDS.includes(key)) return 'done'
  if (RUNNING_KEYWORDS.includes(key)) return 'running'
  if (ERROR_KEYWORDS.includes(key)) return 'failed'
  return 'pending'
}

/** 把运行快照里的 nodeRuns 映射为前端节点清单 */
function normalizeNodeRuns(raw: unknown): IngestNode[] {
  if (!Array.isArray(raw)) return []
  return raw.map((node) => {
    const error = pick(node, 'error')
    return {
      name:
        pickString(node, ['label', 'name', 'nodeId', 'nodeKind']) ??
        '未命名节点',
      status: normalizeRunStatus(pick(node, 'status')),
      durationMs: pickNumber(node, ['durationMs', 'duration_ms']) ?? null,
      message:
        pickString(node, ['errorMessage', 'message']) ??
        pickString(error, ['message', 'detail']),
    }
  })
}

/**
 * 归一化 GET /ai/kb/runs/{runId} 的运行快照：
 * { runId, fileName, status, currentNodeId, progress, nodeRuns[], startedAt, endedAt }
 */
function normalizeRunSnapshot(
  raw: unknown,
  summary: IngestTaskSummary
): IngestTask {
  const rawNodes = pick(raw, 'nodeRuns')
  const nodes = normalizeNodeRuns(rawNodes)
  const status = normalizeRunStatus(pick(raw, 'status'))
  const currentNodeId = pickString(raw, ['currentNodeId', 'current_node'])
  const runningNode = nodes.find((node) => node.status === 'running')
  const doneCount = nodes.filter((node) => node.status === 'done').length

  const startedAt = pickNumber(raw, ['startedAt', 'started_at'])
  const endedAt = pickNumber(raw, ['endedAt', 'ended_at'])
  const elapsedMs =
    startedAt !== undefined && endedAt !== undefined && endedAt >= startedAt
      ? endedAt - startedAt
      : nodes.reduce((sum, node) => sum + (node.durationMs ?? 0), 0)

  // currentNodeId 是节点 ID，展示时优先用该节点自身的 label
  const currentRawNode =
    currentNodeId && Array.isArray(rawNodes)
      ? rawNodes.find(
          (node) => pickString(node, ['nodeId', 'node_id']) === currentNodeId
        )
      : undefined
  const currentLabel = pickString(currentRawNode, ['label', 'name', 'nodeKind'])

  return {
    id: pickString(raw, ['runId', 'taskId']) ?? summary.taskId,
    fileId: pickString(raw, ['fileId', 'file_id']) ?? summary.fileId,
    fileName: pickString(raw, ['fileName', 'file_name']) ?? summary.fileName,
    status,
    currentNode:
      currentLabel ??
      runningNode?.name ??
      (status === 'running' ? (currentNodeId ?? null) : null),
    progress:
      pickNumber(raw, ['progress', 'percent']) ??
      (status === 'done'
        ? 100
        : nodes.length > 0
          ? Math.round((doneCount / nodes.length) * 100)
          : 0),
    elapsedMs,
    nodes,
  }
}

/** 按任务摘要逐个查询运行快照 */
export async function fetchIngestTasks(
  summaries: IngestTaskSummary[]
): Promise<IngestTask[]> {
  return Promise.all(
    summaries.map(async (summary) => {
      const data = await request<Record<string, unknown>>({
        url: `/ai/kb/runs/${encodeURIComponent(summary.taskId)}`,
        method: 'get',
      })
      return normalizeRunSnapshot(data, summary)
    })
  )
}

/**
 * 按知识库查询入库任务（直接查后端运行列表）。
 */
export async function fetchKnowledgeBaseIngestTasks(
  knowledgeBaseId: string
): Promise<IngestTask[]> {
  const rows = await requestRows<unknown>({
    url: '/ai/ingest-runs',
    method: 'get',
    params: { kbId: knowledgeBaseId, pageNum: 1, pageSize: 50 },
  })
  const summaries: IngestTaskSummary[] = rows.flatMap((row) => {
    const taskId = pickString(row, ['runId', 'run_id'])
    if (!taskId) return []
    return [{
      taskId,
      fileId: pickString(row, ['fileId', 'file_id']),
      fileName: pickString(row, ['fileName', 'file_name']),
      status: normalizeRunStatus(pick(row, 'status')),
    }]
  })

  return fetchIngestTasks(summaries)
}

/** 优先用接口内嵌的 tasks，缺失时回退到本地缓存的摘要 */
export function getIngestTasks(item: KnowledgeBaseItem): IngestTaskSummary[] {
  return item.ingestTasks
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
