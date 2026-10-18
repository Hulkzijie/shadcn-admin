import type { Edge } from '@xyflow/react'
import type { AgentFlowNode } from '../flow/data/flow-presets'

/** 单个 Agent 的编排画布数据，创建 Agent 时会初始化一份空白 DSL。 */
export type AgentDsl = {
  nodes: AgentFlowNode[]
  edges: Edge[]
}

export type AgentItem = {
  id: string
  name: string
  description: string
  dsl: AgentDsl
  createdAt: number
  updatedAt: number
}

export type CreateAgentInput = {
  name: string
  description: string
}

export type UpdateAgentInput = {
  name?: string
  description?: string
}
