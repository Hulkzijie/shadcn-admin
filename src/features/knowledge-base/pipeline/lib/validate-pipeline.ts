import type { FlowValidationIssue } from '@/features/flow'
import { isIngestNodeKind } from '../data/ingest-node-registry'
import type {
  IngestNodeData,
  IngestNodeKind,
  PipelineDsl,
} from '../data/pipeline-types'

const MAX_NODE_COUNT = 60
const MAX_SERIAL_DEPTH = 20

/** 链路必需环节：任选其一即视为该环节存在。 */
const REQUIRED_STAGES: Array<{ label: string; kinds: IngestNodeKind[] }> = [
  { label: '解析', kinds: ['parse.document', 'parse.ocr'] },
  { label: '切片', kinds: ['split.chunk'] },
  { label: '向量化', kinds: ['embed.vector'] },
  { label: '向量入库', kinds: ['store.vector'] },
]

/** 建议启用的质量保障节点。 */
const RECOMMENDED_GUARDS: Array<{ kind: IngestNodeKind; label: string }> = [
  { kind: 'guard.quality', label: '质量初检' },
  { kind: 'guard.vector', label: '向量校验' },
  { kind: 'guard.reconcile', label: '入库对账' },
]

/** 必填参数：节点类型 -> 参数键 -> 展示名。 */
const REQUIRED_CONFIG: Partial<
  Record<IngestNodeKind, Array<{ key: string; label: string }>>
> = {
  'input.file': [{ key: 'formats', label: '格式白名单' }],
  'split.chunk': [{ key: 'chunkLength', label: '切片长度' }],
  'embed.vector': [{ key: 'model', label: 'Embedding 模型' }],
  'store.vector': [{ key: 'indexName', label: '索引名称' }],
}

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null) return true
  if (typeof value === 'string') return value.trim() === ''
  if (typeof value === 'number') return Number.isNaN(value) || value <= 0
  return false
}

/** 轻量语法检查：括号配对、引号配对、运算符不能收尾。 */
function checkExpression(raw: string): string | null {
  const expression = raw.trim()
  if (!expression) return '条件表达式不能为空'
  if (/[+\-*/%<>=!&|,]\s*$/.test(expression)) return '条件表达式不完整'

  const stack: string[] = []
  const pairs: Record<string, string> = { ')': '(', ']': '[' }
  let quote: string | null = null
  for (let i = 0; i < expression.length; i += 1) {
    const char = expression[i]
    if (quote) {
      if (char === quote) quote = null
      continue
    }
    if (char === '"' || char === "'") {
      quote = char
      continue
    }
    if (char === '(' || char === '[') stack.push(char)
    if (char === ')' || char === ']') {
      if (stack.pop() !== pairs[char]) return '条件表达式括号不匹配'
    }
  }
  if (quote) return '条件表达式引号未闭合'
  if (stack.length > 0) return '条件表达式括号不匹配'
  return null
}

function hasCycle(nodeIds: string[], next: Map<string, string[]>): boolean {
  const state = new Map<string, 0 | 1 | 2>()
  const visit = (id: string): boolean => {
    const current = state.get(id) ?? 0
    if (current === 1) return true
    if (current === 2) return false
    state.set(id, 1)
    for (const target of next.get(id) ?? []) {
      if (visit(target)) return true
    }
    state.set(id, 2)
    return false
  }
  return nodeIds.some((id) => visit(id))
}

/** 最长串行链路深度（节点数）。 */
function longestChain(nodeIds: string[], next: Map<string, string[]>): number {
  const memo = new Map<string, number>()
  const walk = (id: string): number => {
    const cached = memo.get(id)
    if (cached !== undefined) return cached
    memo.set(id, 1)
    let depth = 1
    for (const target of next.get(id) ?? []) {
      depth = Math.max(depth, 1 + walk(target))
    }
    memo.set(id, depth)
    return depth
  }
  return nodeIds.reduce((max, id) => Math.max(max, walk(id)), 0)
}

/**
 * 按 PRD 8.4 的校验表检查编排 DSL。
 * 返回的 issue 携带 nodeId，画布可直接定位到对应节点。
 */
export function validatePipeline(dsl: PipelineDsl): FlowValidationIssue[] {
  const issues: FlowValidationIssue[] = []
  const nodes = dsl.nodes
  const enabledNodes = nodes.filter((node) => node.data.enabled !== false)
  const enabledIds = new Set(enabledNodes.map((node) => node.id))
  const dataById = new Map<string, IngestNodeData>(
    enabledNodes.map((node) => [node.id, node.data])
  )

  const validEdges = dsl.edges.filter(
    (edge) => enabledIds.has(edge.source) && enabledIds.has(edge.target)
  )
  const next = new Map<string, string[]>()
  const prev = new Map<string, string[]>()
  for (const edge of validEdges) {
    next.set(edge.source, [...(next.get(edge.source) ?? []), edge.target])
    prev.set(edge.target, [...(prev.get(edge.target) ?? []), edge.source])
  }
  const nodeIds = enabledNodes.map((node) => node.id)

  // 1. 入口与结束
  const entries = enabledNodes.filter((node) => node.data.kind === 'input.file')
  if (entries.length === 0) {
    issues.push({ level: 'error', message: '缺少「文件接收」入口节点' })
  } else if (entries.length > 1) {
    entries.slice(1).forEach((node) =>
      issues.push({
        level: 'error',
        message: '只允许存在一个「文件接收」入口',
        nodeId: node.id,
      })
    )
  }
  const hasEnd = enabledNodes.some((node) => node.data.kind === 'flow.end')
  if (!hasEnd) issues.push({ level: 'error', message: '缺少「结束」节点' })

  // 2. 环与孤立节点
  if (hasCycle(nodeIds, next)) {
    issues.push({ level: 'error', message: '编排存在环路，请检查连线方向' })
  }
  for (const node of enabledNodes) {
    const kind = node.data.kind
    if (kind === 'input.file' || kind === 'flow.end') continue
    const hasPrev = (prev.get(node.id) ?? []).length > 0
    const hasNext = (next.get(node.id) ?? []).length > 0
    if (!hasPrev && !hasNext) {
      issues.push({
        level: 'error',
        message: `节点「${node.data.label}」未接入链路`,
        nodeId: node.id,
      })
    }
  }

  // 3. 必填参数与条件分支表达式
  for (const node of enabledNodes) {
    const data = node.data
    if (!isIngestNodeKind(data.kind)) {
      issues.push({
        level: 'error',
        message: `节点「${data.label}」类型未知`,
        nodeId: node.id,
      })
      continue
    }
    const required = REQUIRED_CONFIG[data.kind] ?? []
    for (const field of required) {
      if (isEmptyValue(data.config[field.key])) {
        issues.push({
          level: 'error',
          message: `「${data.label}」缺少必填参数：${field.label}`,
          nodeId: node.id,
        })
      }
    }
    if (data.kind === 'flow.condition') {
      const expression = String(data.config.expression ?? '')
      const expressionError = checkExpression(expression)
      if (expressionError) {
        issues.push({
          level: 'error',
          message: `条件分支「${data.label}」${expressionError}`,
          nodeId: node.id,
        })
      }
      if (isEmptyValue(data.config.defaultBranch)) {
        issues.push({
          level: 'error',
          message: `条件分支「${data.label}」未设置默认分支`,
          nodeId: node.id,
        })
      }
    }
  }

  // 4. 关键链路完整性
  const presentKinds = new Set<IngestNodeKind>(
    enabledNodes.map((node) => node.data.kind)
  )
  for (const stage of REQUIRED_STAGES) {
    if (!stage.kinds.some((kind) => presentKinds.has(kind))) {
      issues.push({
        level: 'error',
        message: `链路缺少「${stage.label}」环节`,
      })
    }
  }

  // 5. 质量保障节点
  for (const guard of RECOMMENDED_GUARDS) {
    const node = enabledNodes.find((item) => item.data.kind === guard.kind)
    if (!node) {
      issues.push({
        level: 'warning',
        message: `未启用「${guard.label}」，入库质量缺乏保障`,
      })
    }
  }

  // 6. 重试与幂等
  for (const node of enabledNodes) {
    const data = dataById.get(node.id)
    if (!data) continue
    const { maxAttempts, idempotent } = data.retry
    if (maxAttempts > 0 && !idempotent) {
      issues.push({
        level: 'warning',
        message: `「${data.label}」会重试但未标记为幂等，可能产生重复写入`,
        nodeId: node.id,
      })
    }
  }

  // 7. 性能提示
  if (enabledNodes.length > MAX_NODE_COUNT) {
    issues.push({
      level: 'warning',
      message: `节点数量 ${enabledNodes.length} 超过 ${MAX_NODE_COUNT}，建议拆分编排`,
    })
  }
  const depth = longestChain(nodeIds, next)
  if (depth > MAX_SERIAL_DEPTH) {
    issues.push({
      level: 'warning',
      message: `串行链路深度 ${depth} 超过 ${MAX_SERIAL_DEPTH}，执行耗时可能过长`,
    })
  }

  return issues
}
