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
  fileCount: number
  segmentMode: SegmentMode
  enhancement: boolean
  createdAt: number
}

/** 入库任务中单个节点的状态 */
export type IngestNodeStatus = 'pending' | 'running' | 'done' | 'error'

/** 入库任务节点，如「PDF转Markdown」「文档切分」 */
export type IngestNode = {
  name: string
  status: IngestNodeStatus
  /** 节点耗时（毫秒），未开始时为 null */
  durationMs: number | null
}

/** 单个文件的入库任务 */
export type IngestTask = {
  id: string
  fileName: string
  fileSize: number
  status: IngestNodeStatus
  /** 整体进度百分比 0-100 */
  progress: number
  /** 总耗时（毫秒） */
  elapsedMs: number
  nodes: IngestNode[]
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
