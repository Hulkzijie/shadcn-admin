import { createContext, useContext, type ReactNode } from 'react'
import type { NodeKind } from './data/flow-presets'

type FlowActions = {
  /** 在指定节点右侧新建下一个节点，并自动连线。 */
  addNextNode: (sourceNodeId: string, kind: NodeKind) => void
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
  if (!context) {
    throw new Error('useFlowActions 必须在 FlowActionsProvider 内使用')
  }
  return context
}
