export type SegmentMode = 'auto' | 'custom'

/** /upload 上传成功后的文件信息 */
export type UploadedFile = {
  id: string
  name: string
  size: number
  url?: string
}

export type FileUploadStatus = 'uploading' | 'done' | 'error'

/** 弹窗内单个文件的本地状态（含上传结果） */
export type KnowledgeFileEntry = {
  file: File
  status: FileUploadStatus
  uploaded?: UploadedFile
  error?: string
}

export type CreateKnowledgeBaseInput = {
  name: string
  description: string
  dataType: KnowledgeDataType
  segmentMode: SegmentMode
  segmentLength: number | null
  preprocessRules: string
  enhancement: boolean
  embeddingModel: string
  /** 已通过 /upload 上传成功的文件 id */
  fileIds: string[]
}

export type KnowledgeBaseItem = {
  id: string
  name: string
  description: string
  dataType: KnowledgeDataType
  /** 关联的文件 id 列表，即创建接口 fileIds 的入参 */
  fileIds: string[]
  /** 各文件对应的入库任务摘要，列表项内嵌，用于轮询 /status/{task_id} */
  ingestTasks: IngestTaskSummary[]
  fileCount: number
  segmentMode: SegmentMode
  enhancement: boolean
  createdAt: number
}

/** 入库任务 / 节点状态 */
export type IngestNodeStatus = 'pending' | 'running' | 'done' | 'failed'

/** 入库任务节点，如「文件解析」「文件入库」 */
export type IngestNode = {
  name: string
  status: IngestNodeStatus
  /** 节点耗时（毫秒），未开始时为 null */
  durationMs: number | null
  /** 失败原因，仅 status 为 failed 时有值 */
  message?: string
}

/** 单个文件的入库任务，id 即 /status/{task_id} 中的 task_id */
export type IngestTask = {
  id: string
  fileId?: string
  fileName?: string
  status: IngestNodeStatus
  /** 当前正在执行 / 卡住的节点名，无则为 null */
  currentNode: string | null
  /** 整体进度百分比 0-100 */
  progress: number
  /** 总耗时（毫秒） */
  elapsedMs: number
  /** 完整节点清单（含未开始的节点） */
  nodes: IngestNode[]
}

/** 列表项内嵌的入库任务摘要，用于定位轮询所需的 task_id */
export type IngestTaskSummary = {
  taskId: string
  fileId?: string
  fileName?: string
  status: IngestNodeStatus
}

export type KnowledgeDataType = 'unstructured' | 'structured' | 'multimodal'

export type KnowledgeDataTypeOption = {
  value: KnowledgeDataType
  label: string
  description: string
  formats: string[]
}

export const dataTypeOptions: KnowledgeDataTypeOption[] = [
  {
    value: 'unstructured',
    label: '非结构化数据',
    description: '文件的主要内容为文本和图表，如文章、报告、书籍等',
    formats: ['TXT', 'MARKDOWN', 'PDF', 'DOC', 'DOCX', 'OFD', 'WPS', 'WPT'],
  },
  {
    value: 'structured',
    label: '结构化数据',
    description:
      '文件的主要内容为结构化文本，需具备明确的字段约束，如问答总结、政策条款、数据收集等',
    formats: ['CSV', 'XLSX', 'XLS', 'ET', 'ETT'],
  },
  {
    value: 'multimodal',
    label: '多模态数据',
    description: '文件的主要内容为图片知识，如文搜图等',
    formats: ['JPG', 'JPEG', 'PNG', 'BMP', 'TIFF'],
  },
]

/** 数据上传支持的文件格式（不含点号） */
export const uploadFormats = [
  'PDF',
  'TXT',
  'DOC',
  'DOCX',
  'MARKDOWN',
  'OFD',
  'WPS',
  'WPT',
]

/** 单个文件大小上限：15MB */
export const MAX_FILE_SIZE = 15 * 1024 * 1024

/** 单次最多上传文件数 */
export const MAX_FILE_COUNT = 50
