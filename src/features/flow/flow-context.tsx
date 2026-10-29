import { createContext, useContext, type ReactNode } from 'react'
import type {
  ConfigFieldSchema,
  FlowNodeDataBase,
  FlowRegistry,
  NodeKindMeta,
} from './types'

/** 画布内部使用的、抹平业务泛型后的注册表视图。 */
export type FlowRegistryView = {
  kinds: string[]
  meta: Record<string, NodeKindMeta<FlowNodeDataBase>>
  groups?: string[]
  dragMime: string
  configSchema?: Record<string, ConfigFieldSchema[] | undefined>
  isKind: (value: string) => boolean
  getConfig: (data: FlowNodeDataBase) => Record<string, unknown>
  applyConfig: (
    data: FlowNodeDataBase,
    next: Record<string, unknown>
  ) => Partial<FlowNodeDataBase>
}

function readConfig(data: FlowNodeDataBase): Record<string, unknown> {
  const value = (data as { config?: unknown }).config
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {}
}

/** 把业务注册表转换成画布可直接消费的运行时视图。 */
export function toRegistryView(
  registry: FlowRegistry<string, FlowNodeDataBase>
): FlowRegistryView {
  return {
    ...(registry as unknown as FlowRegistryView),
    configSchema: registry.configSchema as
      | Record<string, ConfigFieldSchema[] | undefined>
      | undefined,
    getConfig: registry.getConfig ?? readConfig,
    applyConfig:
      registry.applyConfig ??
      ((_data, next) => ({ config: next }) as Partial<FlowNodeDataBase>),
  }
}

const FlowRegistryContext = createContext<FlowRegistryView | null>(null)

export function FlowRegistryProvider({
  value,
  children,
}: {
  value: FlowRegistryView
  children: ReactNode
}) {
  return (
    <FlowRegistryContext.Provider value={value}>
      {children}
    </FlowRegistryContext.Provider>
  )
}

export function useFlowRegistry() {
  const context = useContext(FlowRegistryContext)
  if (!context) throw new Error('useFlowRegistry 必须在 FlowRegistryProvider 内使用')
  return context
}

export type FlowActions = {
  /** 在指定节点右侧新建下一个节点，并自动连线。 */
  addNextNode: (sourceNodeId: string, kind: string) => void
}

const FlowActionsContext = createContext<FlowActions | null>(null)

export function FlowActionsProvider({
  value,
  children,
}: {
  value: FlowActions
  children: ReactNode
}) {
  return (
    <FlowActionsContext.Provider value={value}>
      {children}
    </FlowActionsContext.Provider>
  )
}

export function useFlowActions() {
  const context = useContext(FlowActionsContext)
  if (!context) throw new Error('useFlowActions 必须在 FlowActionsProvider 内使用')
  return context
}
