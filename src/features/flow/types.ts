import type { Edge, Node } from '@xyflow/react'
import type { LucideIcon } from 'lucide-react'

/** 所有编排节点数据的公共字段，业务节点在此基础上扩展自己的字段。 */
export type FlowNodeDataBase = {
  kind: string
  label: string
  description: string
}

/** 通用编排节点，节点渲染器统一使用 'flow' 类型。 */
export type FlowNode<TData extends FlowNodeDataBase = FlowNodeDataBase> = Node<
  TData,
  'flow'
>

/** 画布 DSL：节点 + 连线。 */
export type FlowDsl<TData extends FlowNodeDataBase = FlowNodeDataBase> = {
  nodes: FlowNode<TData>[]
  edges: Edge[]
}

export type ConfigFieldOption = { label: string; value: string }

/**
 * 节点参数的表单描述，配置面板按此渲染。
 * 后续新增业务节点只需在注册表里声明 configSchema，无需改动面板代码。
 */
export type ConfigFieldSchema =
  | {
      key: string
      label: string
      type: 'text'
      placeholder?: string
      hint?: string
    }
  | {
      key: string
      label: string
      type: 'textarea'
      placeholder?: string
      hint?: string
      rows?: number
    }
  | {
      key: string
      label: string
      type: 'number'
      placeholder?: string
      hint?: string
      min?: number
      max?: number
      step?: number
      unit?: string
    }
  | {
      key: string
      label: string
      type: 'select'
      options: ConfigFieldOption[]
      placeholder?: string
      hint?: string
    }
  | {
      key: string
      label: string
      type: 'switch'
      hint?: string
    }

/** 单个节点类型的注册信息。 */
export type NodeKindMeta<TData extends FlowNodeDataBase> = {
  label: string
  summary: string
  /** 节点库分组名称，未设置时归入「其他」。 */
  group?: string
  icon: LucideIcon
  iconClassName: string
  /** 是否允许作为连线终点，默认 true。 */
  canReceive?: boolean
  /** 是否允许作为连线起点，默认 true。 */
  canEmit?: boolean
  /** 从节点库添加该节点时的初始数据。 */
  createData: () => TData
  /** 节点卡片上展示的参数摘要。 */
  describe?: (data: TData) => string | undefined
}

/** 节点注册表：一种编排业务（Agent、知识库入库等）对应一份注册表。 */
export type FlowRegistry<
  TKind extends string,
  TData extends FlowNodeDataBase,
> = {
  kinds: TKind[]
  meta: Record<TKind, NodeKindMeta<TData>>
  /** 节点库分组顺序。 */
  groups?: string[]
  /** 拖拽写入 dataTransfer 的 MIME。 */
  dragMime: string
  /** 各节点的参数表单描述。 */
  configSchema?: Partial<Record<TKind, ConfigFieldSchema[]>>
  isKind: (value: string) => value is TKind
  /** 从节点数据读取参数，默认读取 data.config 对象。 */
  getConfig?: (data: TData) => Record<string, unknown>
  /** 把参数写回节点数据，返回需要合并的 patch。 */
  applyConfig?: (data: TData, next: Record<string, unknown>) => Partial<TData>
}

export type FlowValidationIssue = {
  level: 'error' | 'warning'
  message: string
  nodeId?: string
}
