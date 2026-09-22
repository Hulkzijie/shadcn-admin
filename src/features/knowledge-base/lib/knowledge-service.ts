import { fastapiClient } from '@/lib/api/fastapi-client'
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

/** 只保留字符串元素，用于 done_list / running_list / fileIds 这类字符串数组 */
function toStringList(value: unknown): string[] {
  return Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string')
    : []
}

/**
 * 从创建 / 列表响应中取出每个文件的入库任务摘要。
 * 后端形如 tasks: [{ file_id, file_name, task_id }]，其中 task_id 才是 /status/{task_id} 的入参。
 */
function pickIngestTasks(source: unknown): IngestTaskSummary[] {
  const tasks = pick(source, ['tasks', 'taskList', 'task_list'])
  if (!Array.isArray(tasks)) return []
  return tasks.flatMap((task) => {
    const taskId = pickString(task, ['task_id', 'taskId'])
    if (!taskId) return []
    return [
      {
        taskId,
        fileId: pickString(task, ['file_id', 'fileId']),
        fileName: pickString(task, ['file_name', 'fileName', 'name']),
        status: normalizeStatus(pick(task, ['status', 'state']), 'pending'),
      },
    ]
  })
}

/**
 * 创建响应里拿到的入库任务暂存表。
 * GET /knowledge-base 暂不返回 tasks，关闭进度弹窗后再从卡片打开会拿不到 task_id，用它兜底。
 */
const ingestTaskCache = new Map<string, IngestTaskSummary[]>()

function rememberIngestTasks(kbId: string, tasks: IngestTaskSummary[]) {
  if (tasks.length > 0) ingestTaskCache.set(kbId, tasks)
}

/** 优先用列表项内嵌的 tasks，缺失时回退到创建时暂存的任务 */
export function getIngestTasks(item: KnowledgeBaseItem): IngestTaskSummary[] {
  return item.ingestTasks.length > 0
    ? item.ingestTasks
    : (ingestTaskCache.get(item.id) ?? [])
}

/** 知识库 id：列表 / 创建 / 删除响应统一用 kbId */
const KB_ID_KEYS = ['kbId', 'kb_id']
/** 文件 id：/upload 响应里的 file_id，即创建接口 fileIds 的入参 */
const FILE_ID_KEYS = ['file_id', 'fileId']

/** 后端 id 可能是数字（如 task_id: 1），统一转成字符串 */
function pickId(source: unknown, key: string): string | undefined {
  if (source && typeof source === 'object' && key in source) {
    const value = (source as Record<string, unknown>)[key]
    if (typeof value === 'string' && value.length > 0) return value
    if (typeof value === 'number') return String(value)
  }
  return undefined
}

function getResponseId(data: unknown): string {
  const payload = Array.isArray(data) ? data[0] : data
  for (const key of KB_ID_KEYS) {
    const value = pickId(payload, key)
    if (value) return value
  }
  return crypto.randomUUID()
}

/**
 * 上传单个文件：POST /py-api/upload（multipart/form-data）。
 * 由弹窗在「选择文件」时调用，返回后端持久化后的文件信息。
 */
export async function uploadFile(file: File): Promise<UploadedFile> {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await fastapiClient.post('/upload', formData)

  const fileId = FILE_ID_KEYS.map((key) => pickId(data, key)).find(Boolean)
  // file_id 是创建接口 fileIds 的唯一来源，缺失说明响应不符合约定，直接失败
  if (!fileId) throw new Error('上传响应中缺少 file_id')

  return {
    id: fileId,
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
    // 后端 segmentLength 为 integer（默认 500），auto 模式不传，避免 null 触发 422
    ...(input.segmentLength === null
      ? {}
      : { segmentLength: input.segmentLength }),
    preprocessRules: input.preprocessRules,
    enhancement: input.enhancement,
    embeddingModel: input.embeddingModel,
    fileIds: input.fileIds,
  })

  const id = getResponseId(data)
  // 创建响应里的 tasks 提供各文件的 task_id，用于后续轮询入库进度
  const ingestTasks = pickIngestTasks(data)
  rememberIngestTasks(id, ingestTasks)

  return {
    id,
    name: input.name,
    description: input.description,
    dataType: input.dataType,
    fileIds: input.fileIds,
    ingestTasks,
    fileCount: input.fileIds.length,
    segmentMode: input.segmentMode,
    enhancement: input.enhancement,
    createdAt: Date.now(),
  }
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

/** 兼容毫秒 / 秒级时间戳与 ISO 字符串 */
function normalizeTimestamp(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value < 1e12 ? value * 1000 : value
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    if (!Number.isNaN(parsed)) return parsed
  }
  return Date.now()
}

function normalizeKnowledgeBase(
  raw: unknown,
  index: number
): KnowledgeBaseItem {
  let id = ''
  for (const key of KB_ID_KEYS) {
    id = pickId(raw, key) ?? ''
    if (id) break
  }

  const fileIds = toStringList(pick(raw, ['fileIds', 'file_ids']))

  return {
    id: id || `kb-${index}`,
    name:
      pickString(raw, ['name', 'kbName', 'kb_name', 'title']) ?? '未命名知识库',
    description: pickString(raw, ['description', 'desc', 'remark']) ?? '',
    dataType: normalizeDataType(pick(raw, ['dataType', 'data_type'])),
    fileIds,
    // 列表项内嵌 tasks（含 task_id / file_name / status），打开进度弹窗时无需额外请求
    ingestTasks: pickIngestTasks(raw),
    fileCount:
      pickNumber(raw, ['fileCount', 'file_count', 'fileNum', 'file_num']) ??
      fileIds.length,
    segmentMode:
      pickString(raw, ['segmentMode', 'segment_mode']) === 'custom'
        ? 'custom'
        : 'auto',
    // tinyint 0/1、布尔、字符串 '0'/'1' 都能正确判断
    enhancement:
      Number(
        pick(raw, ['enhancement', 'enableEnhancement', 'enable_enhancement'])
      ) === 1,
    createdAt: normalizeTimestamp(
      pick(raw, ['createdAt', 'created_at', 'createTime', 'create_time'])
    ),
  }
}

/**
 * 查询知识库列表：GET /py-api/knowledge-base。
 * 响应支持直接返回数组，或包在 { items } / { list } / { data } / { records } 中。
 */
export async function fetchKnowledgeBases(): Promise<KnowledgeBaseItem[]> {
  const { data } = await fastapiClient.get('/knowledge-base')
  const list = Array.isArray(data)
    ? data
    : pick(data, ['items', 'list', 'data', 'records'])
  if (!Array.isArray(list)) return []
  return list.map((item, index) => normalizeKnowledgeBase(item, index))
}

/**
 * 删除知识库：DELETE /py-api/knowledge-base/{id}。
 */
export async function deleteKnowledgeBase(id: string): Promise<void> {
  await fastapiClient.delete(`/knowledge-base/${encodeURIComponent(id)}`)
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
  if (ERROR_KEYWORDS.includes(key)) return 'failed'
  if (PENDING_KEYWORDS.includes(key)) return 'pending'
  return fallback
}

/** durations 为「节点名 → 耗时（毫秒）」的映射 */
function normalizeDurations(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const durations: Record<string, number> = {}
  for (const [name, raw] of Object.entries(value as Record<string, unknown>)) {
    const ms = typeof raw === 'number' ? raw : Number(raw)
    if (Number.isFinite(ms)) durations[name] = ms
  }
  return durations
}

/**
 * 归一化节点清单：优先后端返回的完整 pipeline（nodes 数组），
 * 缺失时退回旧结构 done_list / running_list / durations（此时未出现的节点无法得知）。
 */
function normalizeNodes(raw: unknown): IngestNode[] {
  const listed = pick(raw, ['nodes', 'node_list'])
  if (Array.isArray(listed)) {
    return listed.map((node) => ({
      name:
        pickString(node, ['name', 'node_name', 'nodeName', 'title']) ??
        '未命名节点',
      status: normalizeStatus(pick(node, ['status', 'state']), 'pending'),
      durationMs:
        pickNumber(node, ['duration_ms', 'durationMs', 'duration']) ?? null,
      message: pickString(node, [
        'message',
        'error',
        'error_message',
        'errorMessage',
        'reason',
      ]),
    }))
  }

  const doneList = toStringList(pick(raw, ['done_list', 'doneList']))
  const runningList = toStringList(pick(raw, ['running_list', 'runningList']))
  const durations = normalizeDurations(pick(raw, ['durations']))

  const names: string[] = []
  for (const name of [...Object.keys(durations), ...doneList, ...runningList]) {
    if (!names.includes(name)) names.push(name)
  }

  return names.map((name) => ({
    name,
    status: doneList.includes(name)
      ? 'done'
      : runningList.includes(name)
        ? 'running'
        : 'pending',
    durationMs: durations[name] ?? null,
  }))
}

/**
 * 归一化 GET /py-api/status/{task_id} 的响应：
 * { task_id, file_id, file_name, status, current_node, nodes[], total_ms }。
 * summary 来自列表项 / 创建响应，用于在 /status 未返回文件名时兜底。
 */
function normalizeTaskStatus(
  raw: unknown,
  summary: IngestTaskSummary
): IngestTask {
  const nodes = normalizeNodes(raw)
  const durations = normalizeDurations(pick(raw, ['durations']))
  const status = normalizeStatus(pick(raw, ['status', 'state']), 'pending')
  const doneCount = nodes.filter((node) => node.status === 'done').length
  const runningNode = nodes.find((node) => node.status === 'running')

  return {
    id: pickString(raw, ['task_id', 'taskId']) ?? summary.taskId,
    fileId: pickString(raw, ['file_id', 'fileId']) ?? summary.fileId,
    fileName: pickString(raw, ['file_name', 'fileName']) ?? summary.fileName,
    status,
    // 未显式返回时，用运行中的节点作为「当前卡在哪个节点」
    currentNode:
      pickString(raw, ['current_node', 'currentNode']) ??
      runningNode?.name ??
      null,
    progress:
      pickNumber(raw, ['progress', 'percent', 'percentage']) ??
      (status === 'done'
        ? 100
        : nodes.length > 0
          ? Math.round((doneCount / nodes.length) * 100)
          : 0),
    elapsedMs:
      pickNumber(raw, ['total_ms', 'totalMs', 'elapsed_ms', 'elapsedMs']) ??
      Object.values(durations).reduce((sum, ms) => sum + ms, 0),
    nodes,
  }
}

/**
 * 查询入库进度：逐个请求 GET /py-api/status/{task_id}，task_id 取自任务摘要。
 */
export async function fetchIngestTasks(
  summaries: IngestTaskSummary[]
): Promise<IngestTask[]> {
  return Promise.all(
    summaries.map(async (summary) => {
      const { data } = await fastapiClient.get(
        `/status/${encodeURIComponent(summary.taskId)}`
      )
      return normalizeTaskStatus(data, summary)
    })
  )
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
