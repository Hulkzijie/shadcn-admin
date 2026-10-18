import { MarkerType, type Edge } from '@xyflow/react'
import {
  type AgentDsl,
  type AgentItem,
  type CreateAgentInput,
  type UpdateAgentInput,
} from '../data/agent-types'
import {
  createNodeData,
  isNodeKind,
  type AgentFlowNode,
} from '../flow/data/flow-presets'

/**
 * Agent 本地入库的存储键。
 * 当前使用 localStorage 持久化，后续接入后端时只需替换读写实现。
 */
const AGENTS_STORAGE_KEY = 'agents'

/** 新 Agent 的初始编排：一个「开始」节点，用户从它继续搭建流程。 */
function createDefaultDsl(): AgentDsl {
  return {
    nodes: [
      {
        id: 'start',
        type: 'agent',
        position: { x: 0, y: 0 },
        data: createNodeData('start'),
      },
    ],
    edges: [],
  }
}

function normalizeNode(value: unknown): AgentFlowNode | null {
  if (!value || typeof value !== 'object') return null
  const node = value as Record<string, unknown>
  const position = node.position as
    | { x?: unknown; y?: unknown }
    | null
    | undefined
  const data = node.data as Record<string, unknown> | null | undefined

  if (typeof node.id !== 'string' || !node.id) return null
  if (
    !position ||
    typeof position.x !== 'number' ||
    typeof position.y !== 'number'
  ) {
    return null
  }
  if (!data || typeof data.kind !== 'string' || !isNodeKind(data.kind)) {
    return null
  }

  return {
    id: node.id,
    type: 'agent',
    position: { x: position.x, y: position.y },
    data: {
      label:
        typeof data.label === 'string'
          ? data.label
          : createNodeData(data.kind).label,
      kind: data.kind,
      description: typeof data.description === 'string' ? data.description : '',
      config: typeof data.config === 'string' ? data.config : '',
    },
  }
}

function normalizeEdge(value: unknown): Edge | null {
  if (!value || typeof value !== 'object') return null
  const edge = value as Record<string, unknown>

  if (typeof edge.id !== 'string' || !edge.id) return null
  if (typeof edge.source !== 'string' || !edge.source) return null
  if (typeof edge.target !== 'string' || !edge.target) return null

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: 'smoothstep',
    label: typeof edge.label === 'string' ? edge.label : undefined,
    markerEnd: { type: MarkerType.ArrowClosed },
    style: { strokeWidth: 1.5 },
  }
}

function normalizeDsl(value: unknown): AgentDsl {
  if (!value || typeof value !== 'object') return createDefaultDsl()
  const dsl = value as Record<string, unknown>

  return {
    nodes: Array.isArray(dsl.nodes)
      ? dsl.nodes.flatMap((node) => normalizeNode(node) ?? [])
      : [],
    edges: Array.isArray(dsl.edges)
      ? dsl.edges.flatMap((edge) => normalizeEdge(edge) ?? [])
      : [],
  }
}

function normalizeAgent(value: unknown): AgentItem | null {
  if (!value || typeof value !== 'object') return null
  const agent = value as Record<string, unknown>

  if (typeof agent.id !== 'string' || !agent.id) return null

  const createdAt =
    typeof agent.createdAt === 'number' ? agent.createdAt : Date.now()

  return {
    id: agent.id,
    name:
      typeof agent.name === 'string' && agent.name.trim()
        ? agent.name.trim()
        : '未命名 Agent',
    description: typeof agent.description === 'string' ? agent.description : '',
    dsl: normalizeDsl(agent.dsl),
    createdAt,
    updatedAt:
      typeof agent.updatedAt === 'number' ? agent.updatedAt : createdAt,
  }
}

function readAgents(): AgentItem[] {
  try {
    const raw = localStorage.getItem(AGENTS_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed.flatMap((item) => normalizeAgent(item) ?? [])
  } catch {
    return []
  }
}

function writeAgents(agents: AgentItem[]) {
  localStorage.setItem(AGENTS_STORAGE_KEY, JSON.stringify(agents))
}

/** 只保留需要入库的字段，避免把选中态、拖拽态等临时数据写进存储。 */
function toPersistedDsl(dsl: AgentDsl): AgentDsl {
  return {
    nodes: dsl.nodes.map((node) => ({
      id: node.id,
      type: 'agent',
      position: { x: node.position.x, y: node.position.y },
      data: { ...node.data },
    })),
    edges: dsl.edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: 'smoothstep',
      label: typeof edge.label === 'string' ? edge.label : undefined,
      markerEnd: { type: MarkerType.ArrowClosed },
      style: { strokeWidth: 1.5 },
    })),
  }
}

/** 按更新时间倒序返回全部 Agent。 */
export function listAgents(): AgentItem[] {
  return readAgents().sort((a, b) => b.updatedAt - a.updatedAt)
}

export function getAgent(id: string): AgentItem | undefined {
  return readAgents().find((agent) => agent.id === id)
}

/** 创建 Agent，并同时写入一份初始编排（DSL）。 */
export function createAgent(input: CreateAgentInput): AgentItem {
  const now = Date.now()
  const agent: AgentItem = {
    id: crypto.randomUUID(),
    name: input.name.trim(),
    description: input.description.trim(),
    dsl: createDefaultDsl(),
    createdAt: now,
    updatedAt: now,
  }

  writeAgents([agent, ...readAgents()])
  return agent
}

export function updateAgent(
  id: string,
  input: UpdateAgentInput
): AgentItem | undefined {
  let updated: AgentItem | undefined
  const agents = readAgents().map((agent) => {
    if (agent.id !== id) return agent
    updated = {
      ...agent,
      ...input,
      updatedAt: Date.now(),
    }
    return updated
  })

  if (updated) writeAgents(agents)
  return updated
}

/** 保存某个 Agent 的编排画布数据。 */
export function saveAgentDsl(id: string, dsl: AgentDsl): AgentItem | undefined {
  let updated: AgentItem | undefined
  const agents = readAgents().map((agent) => {
    if (agent.id !== id) return agent
    updated = {
      ...agent,
      dsl: toPersistedDsl(dsl),
      updatedAt: Date.now(),
    }
    return updated
  })

  if (updated) writeAgents(agents)
  return updated
}

export function duplicateAgent(id: string): AgentItem | undefined {
  const source = getAgent(id)
  if (!source) return undefined

  const now = Date.now()
  const copy: AgentItem = {
    ...source,
    id: crypto.randomUUID(),
    name: `${source.name} 副本`,
    dsl: structuredClone(source.dsl),
    createdAt: now,
    updatedAt: now,
  }

  writeAgents([copy, ...readAgents()])
  return copy
}

export function deleteAgent(id: string) {
  writeAgents(readAgents().filter((agent) => agent.id !== id))
}
