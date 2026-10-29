import {
  AlignLeft,
  BadgeCheck,
  Binary,
  Boxes,
  Copy,
  Database,
  Eraser,
  FileInput,
  FileText,
  Flag,
  GitBranch,
  History,
  KeyRound,
  ListChecks,
  ScanLine,
  Scale,
  Scissors,
  SearchCheck,
  ShieldCheck,
  Tags,
  UserRoundCheck,
  type LucideIcon,
} from 'lucide-react'
import type {
  ConfigFieldSchema,
  FlowRegistry,
  NodeKindMeta,
} from '@/features/flow'
import type {
  IngestNodeData,
  IngestNodeKind,
  NodeFailPolicy,
  RetryPolicy,
} from './pipeline-types'

export const INGEST_NODE_GROUPS = [
  '接入',
  '解析',
  '处理',
  '增强',
  '存储',
  '控制',
] as const

export type IngestNodeGroup = (typeof INGEST_NODE_GROUPS)[number]

const GROUP_CLASS: Record<IngestNodeGroup, string> = {
  接入: 'bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20 dark:text-sky-400',
  解析: 'bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20 dark:text-violet-400',
  处理: 'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400',
  增强: 'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400',
  存储: 'bg-blue-500/10 text-blue-600 ring-1 ring-blue-500/20 dark:text-blue-400',
  控制: 'bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20 dark:text-slate-300',
}

export const INGEST_DRAG_MIME = 'application/x-ingest-node-kind'

const DEFAULT_RETRY: RetryPolicy = {
  maxAttempts: 0,
  intervalMs: 3000,
  backoff: 'fixed',
  timeoutMs: 0,
  idempotent: true,
}

const MODEL_OPTIONS = [
  { label: '通义千问 Plus', value: 'qwen-plus' },
  { label: '通义千问 Max', value: 'qwen-max' },
  { label: 'DeepSeek V3', value: 'deepseek-v3' },
]

type IngestNodeSpec = {
  label: string
  summary: string
  group: IngestNodeGroup
  icon: LucideIcon
  canReceive?: boolean
  canEmit?: boolean
  defaults: Record<string, unknown>
  failPolicy?: NodeFailPolicy
  retry?: Partial<RetryPolicy>
  schema: ConfigFieldSchema[]
  describe?: (config: Record<string, unknown>) => string | undefined
}

function text(
  key: string,
  label: string,
  placeholder?: string,
  hint?: string
): ConfigFieldSchema {
  return { key, label, type: 'text', placeholder, hint }
}

function num(
  key: string,
  label: string,
  options: {
    min?: number
    max?: number
    step?: number
    unit?: string
    hint?: string
  } = {}
): ConfigFieldSchema {
  return { key, label, type: 'number', ...options }
}

function select(
  key: string,
  label: string,
  options: Array<{ label: string; value: string }>,
  hint?: string
): ConfigFieldSchema {
  return { key, label, type: 'select', options, hint }
}

function toggle(key: string, label: string, hint?: string): ConfigFieldSchema {
  return { key, label, type: 'switch', hint }
}

export const INGEST_NODE_SPECS: Record<IngestNodeKind, IngestNodeSpec> = {
  'input.file': {
    label: '文件接收',
    summary: '接收上传文件，按批次入队分发',
    group: '接入',
    icon: FileInput,
    canReceive: false,
    defaults: {
      formats: 'PDF, DOCX, TXT, MARKDOWN',
      maxFileSizeMb: 15,
      batchSize: 50,
    },
    failPolicy: 'retry_then_abort',
    retry: { maxAttempts: 2, idempotent: true },
    schema: [
      text(
        'formats',
        '格式白名单',
        'PDF, DOCX, TXT',
        '按数据类型限定，逗号分隔'
      ),
      num('maxFileSizeMb', '单文件大小上限', { min: 1, max: 100, unit: 'MB' }),
      num('batchSize', '批量入队大小', { min: 1, max: 200, unit: '个' }),
    ],
    describe: (config) =>
      `${String(config.formats ?? '')} · 上限 ${String(config.maxFileSizeMb ?? '')}MB`,
  },
  'guard.precheck': {
    label: '前置校验',
    summary: '校验格式、大小、重复与安全性',
    group: '接入',
    icon: ShieldCheck,
    defaults: {
      allowEmpty: false,
      checkFileHeader: true,
      duplicatePolicy: 'skip',
    },
    schema: [
      toggle('allowEmpty', '允许空文件'),
      toggle('checkFileHeader', '校验文件头与真实类型'),
      select('duplicatePolicy', '重复文件处理', [
        { label: '跳过', value: 'skip' },
        { label: '覆盖', value: 'overwrite' },
        { label: '报错', value: 'fail' },
      ]),
    ],
  },
  'parse.document': {
    label: '文档解析',
    summary: '解析文档正文、表格与层级结构',
    group: '解析',
    icon: FileText,
    defaults: {
      engine: 'auto',
      keepHeaderFooter: false,
      tableRecognition: true,
    },
    schema: [
      select('engine', '解析引擎', [
        { label: '自动识别', value: 'auto' },
        { label: 'PDFBox', value: 'pdfbox' },
        { label: 'Apache Tika', value: 'tika' },
      ]),
      toggle('keepHeaderFooter', '保留页眉页脚'),
      toggle('tableRecognition', '识别表格结构'),
    ],
  },
  'parse.ocr': {
    label: '图像 OCR',
    summary: '对图片或扫描件做文字识别',
    group: '解析',
    icon: ScanLine,
    defaults: {
      language: 'chi_sim+eng',
      accuracy: 'accurate',
      preprocess: true,
    },
    schema: [
      select('language', '识别语言', [
        { label: '中英混合', value: 'chi_sim+eng' },
        { label: '简体中文', value: 'chi_sim' },
        { label: '英文', value: 'eng' },
      ]),
      select('accuracy', '识别精度', [
        { label: '高精度', value: 'accurate' },
        { label: '快速', value: 'fast' },
      ]),
      toggle('preprocess', '图片预处理（去噪、纠偏）'),
    ],
  },
  'clean.normalize': {
    label: '清洗归一',
    summary: '去除噪声、统一编码与格式',
    group: '处理',
    icon: Eraser,
    defaults: {
      stripHtml: true,
      normalizeWidth: true,
      customRules: '',
    },
    schema: [
      toggle('stripHtml', '去除 HTML 标签'),
      toggle('normalizeWidth', '全角半角归一'),
      {
        key: 'customRules',
        label: '自定义清洗规则',
        type: 'textarea',
        rows: 3,
        placeholder: '每行一条正则，例如：\\s{2,} -> 空格',
      },
    ],
  },
  'guard.quality': {
    label: '质量初检',
    summary: '校验有效文本占比与乱码率',
    group: '处理',
    icon: BadgeCheck,
    defaults: {
      minTextRatio: 10,
      maxGarbledRatio: 5,
      onLowQuality: 'fail',
    },
    schema: [
      num('minTextRatio', '有效文本占比下限', { min: 0, max: 100, unit: '%' }),
      num('maxGarbledRatio', '乱码率上限', { min: 0, max: 100, unit: '%' }),
      select('onLowQuality', '质量不达标处理', [
        { label: '中止并告警', value: 'fail' },
        { label: '继续入库', value: 'continue' },
      ]),
    ],
  },
  'split.chunk': {
    label: '切片',
    summary: '按长度与语义切分为知识片段',
    group: '处理',
    icon: Scissors,
    defaults: {
      chunkLength: 500,
      overlap: 50,
      strategy: 'recursive',
    },
    schema: [
      num('chunkLength', '切片长度', {
        min: 100,
        max: 2000,
        unit: '字符',
        hint: '建议 300-800，过短会丢失上下文',
      }),
      num('overlap', '重叠长度', { min: 0, max: 500, unit: '字符' }),
      select('strategy', '切分策略', [
        { label: '递归切分', value: 'recursive' },
        { label: '固定长度', value: 'fixed' },
        { label: '语义切分', value: 'semantic' },
      ]),
    ],
    describe: (config) =>
      `切片 ${String(config.chunkLength ?? '')} · 重叠 ${String(config.overlap ?? '')}`,
  },
  'split.dedupe': {
    label: '去重',
    summary: '识别并合并重复或高度相似片段',
    group: '处理',
    icon: Copy,
    defaults: {
      similarity: 0.95,
      algorithm: 'simhash',
    },
    schema: [
      num('similarity', '相似度阈值', { min: 0.5, max: 1, step: 0.01 }),
      select('algorithm', '去重算法', [
        { label: 'SimHash', value: 'simhash' },
        { label: 'MinHash', value: 'minhash' },
      ]),
    ],
  },
  'enrich.entity': {
    label: '实体标注',
    summary: '抽取人物、组织、产品等实体',
    group: '增强',
    icon: Tags,
    defaults: {
      entityTypes: '人物, 组织, 产品, 业务术语',
      model: 'qwen-plus',
      onFailure: 'fallback',
    },
    schema: [
      text('entityTypes', '实体类型', '人物, 组织, 产品'),
      select('model', '增强模型', MODEL_OPTIONS),
      select('onFailure', '增强失败处理', [
        { label: '使用兜底标签', value: 'fallback' },
        { label: '跳过增强', value: 'skip' },
        { label: '中止流程', value: 'abort' },
      ]),
    ],
  },
  'enrich.summary': {
    label: '摘要生成',
    summary: '为片段或文档生成摘要',
    group: '增强',
    icon: AlignLeft,
    defaults: {
      maxLength: 120,
      model: 'qwen-plus',
    },
    schema: [
      num('maxLength', '摘要长度上限', { min: 50, max: 500, unit: '字' }),
      select('model', '摘要模型', MODEL_OPTIONS),
    ],
  },
  'enrich.keywords': {
    label: '关键词提取',
    summary: '为片段生成检索关键词',
    group: '增强',
    icon: KeyRound,
    defaults: {
      maxKeywords: 8,
      model: 'qwen-plus',
    },
    schema: [
      num('maxKeywords', '关键词数量', { min: 1, max: 30, unit: '个' }),
      select('model', '提取模型', MODEL_OPTIONS),
    ],
  },
  'compliance.review': {
    label: '合规审核',
    summary: '按敏感词库或模型审核内容',
    group: '增强',
    icon: Scale,
    defaults: {
      strategy: 'model',
      onHit: 'flag',
    },
    schema: [
      select('strategy', '审核策略', [
        { label: '模型审核', value: 'model' },
        { label: '敏感词库', value: 'lexicon' },
        { label: '双引擎', value: 'hybrid' },
      ]),
      select('onHit', '命中处理', [
        { label: '打标放行', value: 'flag' },
        { label: '拦截', value: 'block' },
        { label: '转人工', value: 'manual' },
      ]),
    ],
  },
  'embed.vector': {
    label: '向量化',
    summary: '调用 Embedding 模型生成向量',
    group: '存储',
    icon: Binary,
    defaults: {
      model: 'qwen3-embedding',
      dimensions: 1024,
      batchSize: 32,
    },
    failPolicy: 'retry_then_abort',
    retry: { maxAttempts: 2, idempotent: true },
    schema: [
      select('model', 'Embedding 模型', [
        { label: '通义千问 Embedding', value: 'qwen3-embedding' },
        { label: 'BGE-M3', value: 'bge-m3' },
        { label: 'OpenAI Large', value: 'text-embedding-3-large' },
      ]),
      num('dimensions', '向量维度', { min: 128, max: 4096 }),
      num('batchSize', '批量大小', { min: 1, max: 128, unit: '条' }),
    ],
    describe: (config) => String(config.model ?? ''),
  },
  'guard.vector': {
    label: '向量校验',
    summary: '校验维度一致性与空向量',
    group: '存储',
    icon: SearchCheck,
    defaults: {
      dimensionCheck: true,
      emptyCheck: true,
      onInvalid: 'fail',
    },
    schema: [
      toggle('dimensionCheck', '校验向量维度一致'),
      toggle('emptyCheck', '检测空向量'),
      select('onInvalid', '异常向量处理', [
        { label: '中止流程', value: 'fail' },
        { label: '跳过异常向量', value: 'skip' },
      ]),
    ],
  },
  'store.vector': {
    label: '向量入库',
    summary: '把向量与元数据写入向量库',
    group: '存储',
    icon: Database,
    defaults: {
      indexName: 'kb_default',
      mode: 'upsert',
      writeBatchSize: 100,
    },
    failPolicy: 'retry_then_abort',
    retry: { maxAttempts: 2, idempotent: true },
    schema: [
      text('indexName', '索引名称', 'kb_default'),
      select('mode', '写入模式', [
        { label: '覆盖写入', value: 'upsert' },
        { label: '仅新增', value: 'insert' },
      ]),
      num('writeBatchSize', '分批写入大小', { min: 10, max: 500, unit: '条' }),
    ],
    describe: (config) => String(config.indexName ?? ''),
  },
  'guard.reconcile': {
    label: '入库对账',
    summary: '核对写入数量与校验和',
    group: '存储',
    icon: ListChecks,
    defaults: {
      strategy: 'both',
      tolerance: 0,
      onMismatch: 'alert_and_retry',
    },
    schema: [
      select('strategy', '对账方式', [
        { label: '数量比对', value: 'count' },
        { label: '校验和', value: 'checksum' },
        { label: '两者都比', value: 'both' },
      ]),
      num('tolerance', '容忍误差', { min: 0, max: 100, unit: '条' }),
      select('onMismatch', '不一致处理', [
        { label: '仅告警', value: 'alert' },
        { label: '自动重跑', value: 'retry' },
        { label: '告警并重跑', value: 'alert_and_retry' },
      ]),
    ],
  },
  'store.master': {
    label: '主数据与缓存',
    summary: '更新主数据表与检索缓存',
    group: '存储',
    icon: Boxes,
    defaults: {
      masterTable: 'kb_document',
      conflictPolicy: 'merge',
      refreshCache: true,
    },
    schema: [
      text('masterTable', '主数据表', 'kb_document'),
      select('conflictPolicy', '冲突处理', [
        { label: '合并', value: 'merge' },
        { label: '覆盖', value: 'overwrite' },
        { label: '跳过', value: 'skip' },
      ]),
      toggle('refreshCache', '刷新检索缓存'),
    ],
  },
  'flow.condition': {
    label: '条件分支',
    summary: '按表达式把流程分流到不同分支',
    group: '控制',
    icon: GitBranch,
    defaults: {
      expression: 'qualityRatio >= 0.1',
      defaultBranch: 'continue',
    },
    schema: [
      text(
        'expression',
        '条件表达式',
        'qualityRatio >= 0.1',
        '可用变量：qualityRatio、chunkCount 等'
      ),
      select('defaultBranch', '默认分支', [
        { label: '继续主流程', value: 'continue' },
        { label: '结束流程', value: 'end' },
      ]),
    ],
    describe: (config) => String(config.expression ?? ''),
  },
  'flow.human-review': {
    label: '人工审核',
    summary: '暂停流程，等待人工确认',
    group: '控制',
    icon: UserRoundCheck,
    defaults: {
      reviewerRole: '知识库管理员',
      timeoutMinutes: 60,
      onTimeout: 'reject',
    },
    schema: [
      text('reviewerRole', '审核角色', '知识库管理员'),
      num('timeoutMinutes', '审核超时', { min: 5, max: 1440, unit: '分钟' }),
      select('onTimeout', '超时处理', [
        { label: '自动驳回', value: 'reject' },
        { label: '自动通过', value: 'approve' },
      ]),
    ],
  },
  'store.version': {
    label: '版本写入',
    summary: '写入新版本并保留历史',
    group: '控制',
    icon: History,
    defaults: {
      versionStrategy: 'auto_increment',
      keepVersions: 5,
    },
    schema: [
      select('versionStrategy', '版本号策略', [
        { label: '自增版本号', value: 'auto_increment' },
        { label: '日期 + 自增', value: 'date_auto' },
      ]),
      num('keepVersions', '保留历史版本', { min: 1, max: 50, unit: '个' }),
    ],
  },
  'flow.end': {
    label: '结束',
    summary: '结束本次入库，记录结果',
    group: '控制',
    icon: Flag,
    canEmit: false,
    defaults: {
      status: 'success',
      withSummary: true,
    },
    schema: [
      select('status', '结束状态', [
        { label: '成功', value: 'success' },
        { label: '失败', value: 'fail' },
      ]),
      toggle('withSummary', '输出处理摘要'),
    ],
  },
}

export const INGEST_NODE_ORDER = Object.keys(
  INGEST_NODE_SPECS
) as IngestNodeKind[]

/** 按分组顺序排列节点类型，供节点库展示。 */
export const INGEST_NODE_ORDER_BY_GROUP = INGEST_NODE_GROUPS.flatMap((group) =>
  INGEST_NODE_ORDER.filter((kind) => INGEST_NODE_SPECS[kind].group === group)
)

export function isIngestNodeKind(value: string): value is IngestNodeKind {
  return value in INGEST_NODE_SPECS
}

export function createIngestNodeData(
  kind: IngestNodeKind,
  overrides: {
    label?: string
    description?: string
    config?: Record<string, unknown>
  } = {}
): IngestNodeData {
  const spec = INGEST_NODE_SPECS[kind]
  return {
    kind,
    label: overrides.label ?? spec.label,
    description: overrides.description ?? spec.summary,
    enabled: true,
    config: { ...spec.defaults, ...overrides.config },
    failPolicy: spec.failPolicy ?? 'abort',
    retry: { ...DEFAULT_RETRY, ...spec.retry },
  }
}

export const INGEST_CONFIG_SCHEMA = Object.fromEntries(
  INGEST_NODE_ORDER.map((kind) => [kind, INGEST_NODE_SPECS[kind].schema])
) as Record<IngestNodeKind, ConfigFieldSchema[]>

export const INGEST_NODE_META = Object.fromEntries(
  INGEST_NODE_ORDER.map((kind) => {
    const spec = INGEST_NODE_SPECS[kind]
    const describe = spec.describe
    const meta: NodeKindMeta<IngestNodeData> = {
      label: spec.label,
      summary: spec.summary,
      group: spec.group,
      icon: spec.icon,
      iconClassName: GROUP_CLASS[spec.group],
      canReceive: spec.canReceive,
      canEmit: spec.canEmit,
      createData: () => createIngestNodeData(kind),
      describe: describe ? (data) => describe(data.config) : undefined,
    }
    return [kind, meta]
  })
) as Record<IngestNodeKind, NodeKindMeta<IngestNodeData>>

/**
 * 知识库入库编排的节点注册表。
 * 后续其它 PRD 只需照此新增一份注册表，画布与配置面板无需改动。
 */
export const INGEST_FLOW_REGISTRY: FlowRegistry<
  IngestNodeKind,
  IngestNodeData
> = {
  kinds: INGEST_NODE_ORDER_BY_GROUP,
  meta: INGEST_NODE_META,
  groups: [...INGEST_NODE_GROUPS],
  dragMime: INGEST_DRAG_MIME,
  configSchema: INGEST_CONFIG_SCHEMA,
  isKind: isIngestNodeKind,
  getConfig: (data) => data.config,
  applyConfig: (_data, next) => ({ config: next }),
}
