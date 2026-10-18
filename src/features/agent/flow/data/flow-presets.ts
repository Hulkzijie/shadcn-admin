import type { Node } from '@xyflow/react'
import {
  BookOpen,
  GitBranch,
  Play,
  Sparkles,
  Square,
  Wrench,
  type LucideIcon,
} from 'lucide-react'

export type NodeKind =
  | 'start'
  | 'llm'
  | 'knowledge'
  | 'condition'
  | 'tool'
  | 'end'

export type FlowNodeData = {
  label: string
  kind: NodeKind
  description: string
  config: string
}

/** 自定义节点类型，第二个泛型用于区分 nodeTypes 的 key。 */
export type AgentFlowNode = Node<FlowNodeData, 'agent'>

type NodeKindMeta = {
  label: string
  summary: string
  defaultConfig: string
  icon: LucideIcon
  iconClassName: string
  dotClassName: string
}

export const NODE_KIND_META: Record<NodeKind, NodeKindMeta> = {
  start: {
    label: '开始',
    summary: '流程入口，接收用户输入',
    defaultConfig: '',
    icon: Play,
    iconClassName:
      'bg-emerald-500/10 text-emerald-600 ring-1 ring-emerald-500/20 dark:text-emerald-400',
    dotClassName: 'bg-emerald-500',
  },
  llm: {
    label: '大模型',
    summary: '调用模型理解并生成内容',
    defaultConfig: 'DeepSeek-V3',
    icon: Sparkles,
    iconClassName:
      'bg-violet-500/10 text-violet-600 ring-1 ring-violet-500/20 dark:text-violet-400',
    dotClassName: 'bg-violet-500',
  },
  knowledge: {
    label: '知识库',
    summary: '检索企业知识增强回答',
    defaultConfig: '售后知识库',
    icon: BookOpen,
    iconClassName:
      'bg-sky-500/10 text-sky-600 ring-1 ring-sky-500/20 dark:text-sky-400',
    dotClassName: 'bg-sky-500',
  },
  condition: {
    label: '条件判断',
    summary: '按表达式分流到不同分支',
    defaultConfig: 'intent = 售后',
    icon: GitBranch,
    iconClassName:
      'bg-amber-500/10 text-amber-600 ring-1 ring-amber-500/20 dark:text-amber-400',
    dotClassName: 'bg-amber-500',
  },
  tool: {
    label: '工具调用',
    summary: '调用接口或外部工具执行动作',
    defaultConfig: '订单查询 API',
    icon: Wrench,
    iconClassName:
      'bg-rose-500/10 text-rose-600 ring-1 ring-rose-500/20 dark:text-rose-400',
    dotClassName: 'bg-rose-500',
  },
  end: {
    label: '结束',
    summary: '输出结果，流程结束',
    defaultConfig: '',
    icon: Square,
    iconClassName:
      'bg-slate-500/10 text-slate-600 ring-1 ring-slate-500/20 dark:text-slate-300',
    dotClassName: 'bg-slate-400',
  },
}

/** 左侧节点面板的展示顺序。 */
export const NODE_KIND_ORDER: NodeKind[] = [
  'start',
  'llm',
  'knowledge',
  'condition',
  'tool',
  'end',
]

/** 拖拽时写入 dataTransfer 的 MIME 类型。 */
export const NODE_DRAG_MIME = 'application/x-agent-node-kind'

export function isNodeKind(value: string): value is NodeKind {
  return value in NODE_KIND_META
}

export function createNodeData(kind: NodeKind): FlowNodeData {
  const meta = NODE_KIND_META[kind]
  return {
    label: meta.label,
    kind,
    description: meta.summary,
    config: meta.defaultConfig,
  }
}
