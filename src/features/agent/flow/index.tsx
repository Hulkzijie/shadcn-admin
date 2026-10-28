import { useCallback, useMemo, useRef, useState, type DragEvent } from 'react'
import { Link } from '@tanstack/react-router'
import {
  addEdge,
  Background,
  BackgroundVariant,
  Controls,
  MarkerType,
  MiniMap,
  Panel,
  ReactFlow,
  ReactFlowProvider,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Connection,
  type Edge,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  ArrowLeft,
  Maximize2,
  MessageSquare,
  PanelRight,
  Save,
  Workflow,
} from 'lucide-react'
import { toast } from 'sonner'
import { useTheme } from '@/context/theme-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ConfigDrawer } from '@/components/config-drawer'
import { ThemeSwitch } from '@/components/theme-switch'
import { getAgent, saveAgentDsl } from '../lib/agent-service'
import {
  createNodeData,
  isNodeKind,
  NODE_DRAG_MIME,
  type AgentFlowNode,
  type FlowNodeData,
  type NodeKind,
} from './data/flow-presets'
import { FlowActionsProvider } from './flow-actions-context'
import { AgentNode } from './flow-node'
import { NodeInspector } from './node-inspector'
import { NodePalette } from './node-palette'

const nodeTypes = { agent: AgentNode }

const defaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { strokeWidth: 1.5 },
} as const

function FlowEditor({ agentId }: { agentId: string }) {
  const { resolvedTheme } = useTheme()
  const { fitView, screenToFlowPosition, getNode, getNodes, getEdges } =
    useReactFlow()

  const agent = useMemo(() => getAgent(agentId), [agentId])

  const [nodes, setNodes, onNodesChange] = useNodesState<AgentFlowNode>(
    agent?.dsl.nodes ?? []
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(
    agent?.dsl.edges ?? []
  )
  const [dirty, setDirty] = useState(false)
  const [mobileConfigOpen, setMobileConfigOpen] = useState(false)

  const canvasRef = useRef<HTMLDivElement>(null)

  const selectedNode = nodes.find((node) => node.selected) ?? null

  // 只有结构或位置变化才标记为未保存，单纯选中节点不触发。
  const handleNodesChange: OnNodesChange<AgentFlowNode> = (changes) => {
    onNodesChange(changes)
    if (
      changes.some(
        (change) =>
          change.type === 'position' ||
          change.type === 'remove' ||
          change.type === 'add'
      )
    ) {
      setDirty(true)
    }
  }

  const handleEdgesChange: OnEdgesChange<Edge> = (changes) => {
    onEdgesChange(changes)
    if (
      changes.some(
        (change) => change.type === 'remove' || change.type === 'replace'
      )
    ) {
      setDirty(true)
    }
  }

  const addNode = (kind: NodeKind, position?: { x: number; y: number }) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    const center =
      position ??
      screenToFlowPosition({
        x: rect ? rect.x + rect.width / 2 : window.innerWidth / 2,
        y: rect ? rect.y + rect.height / 2 : window.innerHeight / 2,
      })
    const offset = (nodes.length % 4) * 24

    const newNode: AgentFlowNode = {
      id: `${kind}-${crypto.randomUUID().slice(0, 8)}`,
      type: 'agent',
      position: {
        x: center.x - 112 + offset,
        y: center.y - 44 + offset,
      },
      data: createNodeData(kind),
      selected: true,
    }

    setNodes((current) => [
      ...current.map((node) => ({ ...node, selected: false })),
      newNode,
    ])
    setDirty(true)
  }

  const addNextNode = useCallback(
    (sourceNodeId: string, kind: NodeKind) => {
      const sourceNode = getNode(sourceNodeId)
      if (!sourceNode) return

      const sourceWidth = sourceNode.measured?.width ?? 224
      const nodeHeight = 104
      const gapX = 96
      const gapY = 24

      const childIds = new Set(
        getEdges()
          .filter((edge) => edge.source === sourceNodeId)
          .map((edge) => edge.target)
      )
      const children = getNodes().filter((node) => childIds.has(node.id))

      const overlaps = (candidateY: number) =>
        children.some((child) => {
          const childHeight = child.measured?.height ?? nodeHeight
          return (
            candidateY < child.position.y + childHeight + gapY &&
            child.position.y < candidateY + nodeHeight + gapY
          )
        })

      let y = sourceNode.position.y
      while (overlaps(y)) {
        y += nodeHeight + gapY
      }

      const newNode: AgentFlowNode = {
        id: `${kind}-${crypto.randomUUID().slice(0, 8)}`,
        type: 'agent',
        position: { x: sourceNode.position.x + sourceWidth + gapX, y },
        data: createNodeData(kind),
        selected: true,
      }

      setNodes((current) => [
        ...current.map((node) => ({ ...node, selected: false })),
        newNode,
      ])
      setEdges((current) =>
        addEdge(
          {
            id: `${sourceNodeId}-${newNode.id}`,
            source: sourceNodeId,
            target: newNode.id,
            type: 'smoothstep',
            markerEnd: { type: MarkerType.ArrowClosed },
          },
          current
        )
      )
      setDirty(true)
    },
    [getEdges, getNode, getNodes, setEdges, setNodes]
  )

  const flowActions = useMemo(() => ({ addNextNode }), [addNextNode])

  const onConnect = (connection: Connection) => {
    setEdges((current) =>
      addEdge(
        {
          ...connection,
          type: 'smoothstep',
          markerEnd: { type: MarkerType.ArrowClosed },
        },
        current
      )
    )
    setDirty(true)
  }

  const onDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const kind = event.dataTransfer.getData(NODE_DRAG_MIME)
    if (!isNodeKind(kind)) return
    addNode(kind, screenToFlowPosition({ x: event.clientX, y: event.clientY }))
  }

  const updateSelectedNode = (patch: Partial<FlowNodeData>) => {
    if (!selectedNode) return
    const id = selectedNode.id
    setNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...patch } } : node
      )
    )
    setDirty(true)
  }

  const deleteSelectedNode = () => {
    if (!selectedNode) return
    const id = selectedNode.id
    setNodes((current) => current.filter((node) => node.id !== id))
    setEdges((current) =>
      current.filter((edge) => edge.source !== id && edge.target !== id)
    )
    setMobileConfigOpen(false)
    setDirty(true)
  }

  const deselectNode = () => {
    setNodes((current) =>
      current.map((node) =>
        node.selected ? { ...node, selected: false } : node
      )
    )
  }

  const fitCanvas = () => {
    void fitView({ padding: 0.18 })
  }

  const saveFlow = () => {
    const saved = saveAgentDsl(agentId, { nodes, edges })
    if (!saved) {
      toast.error('保存失败', { description: '该 Agent 可能已被删除' })
      return
    }
    setDirty(false)
    toast.success('编排已保存', {
      description: `${nodes.length} 个节点，${edges.length} 条连线`,
    })
  }

  if (!agent) {
    return (
      <div className='flex h-svh w-full flex-col items-center justify-center gap-3 bg-background px-6 text-center'>
        <span className='flex size-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground'>
          <Workflow className='size-6' aria-hidden='true' />
        </span>
        <div>
          <p className='text-sm font-medium'>未找到该 Agent</p>
          <p className='mt-1 text-xs text-muted-foreground'>
            它可能已被删除，请返回列表重新创建。
          </p>
        </div>
        <Button asChild size='sm'>
          <Link to={'/agents' as string}>返回 Agent 列表</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className='flex h-svh w-full min-w-0 touch-manipulation flex-col overflow-hidden bg-background'>
      <header className='flex h-14 shrink-0 items-center gap-2 border-b bg-background px-2 sm:px-4'>
        <Button
          asChild
          size='icon'
          variant='ghost'
          aria-label='返回 Agent 列表'
          className='rounded-full'
        >
          <Link to={'/agents' as string}>
            <ArrowLeft aria-hidden='true' />
          </Link>
        </Button>
        <span className='flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
          <Workflow className='size-4' aria-hidden='true' />
        </span>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <h1 className='truncate text-sm font-semibold'>
              {agent?.name ?? 'Agent 编排'}
            </h1>
            <Badge variant={dirty ? 'secondary' : 'outline'}>
              {dirty ? '未保存' : '已保存'}
            </Badge>
          </div>
          <p className='truncate text-xs text-muted-foreground'>
            拖拽节点、连接流程，保存后写入该 Agent 的编排
          </p>
        </div>

        <div className='flex shrink-0 items-center gap-1'>
          <Button asChild variant='ghost' size='sm' className='px-2 sm:px-3'>
            <Link to='/agent' aria-label='返回对话'>
              <MessageSquare className='size-4' aria-hidden='true' />
              <span className='hidden sm:inline'>对话</span>
            </Link>
          </Button>
          <div className='ms-1 hidden items-center gap-1 sm:flex'>
            <ThemeSwitch />
            <ConfigDrawer />
          </div>
          <Button
            type='button'
            size='sm'
            onClick={saveFlow}
            className='ms-1 px-2 sm:px-3'
          >
            <Save className='size-4' aria-hidden='true' />
            <span className='hidden sm:inline'>保存</span>
          </Button>
        </div>
      </header>

      <div className='flex min-h-0 flex-1 flex-col lg:flex-row'>
        <NodePalette onAdd={addNode} />

        <div className='flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row'>
          <div
            ref={canvasRef}
            onDrop={onDrop}
            onDragOver={onDragOver}
            className='relative min-h-0 flex-1 bg-muted/20'
          >
            <FlowActionsProvider value={flowActions}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={handleNodesChange}
                onEdgesChange={handleEdgesChange}
                onConnect={onConnect}
                nodeTypes={nodeTypes}
                defaultEdgeOptions={defaultEdgeOptions}
                colorMode={resolvedTheme}
                fitView
                fitViewOptions={{ padding: 0.18 }}
                minZoom={0.2}
                maxZoom={1.6}
                snapToGrid
                snapGrid={[16, 16]}
                deleteKeyCode={['Backspace', 'Delete']}
                connectionLineStyle={{ strokeWidth: 1.5 }}
                className='touch-manipulation'
              >
                <Background
                  variant={BackgroundVariant.Dots}
                  gap={18}
                  size={1}
                  color='var(--border)'
                />
                <Controls showInteractive={false} />
                <MiniMap
                  pannable
                  zoomable
                  className='hidden lg:block'
                  maskColor='var(--muted)'
                />
                <Panel
                  position='top-left'
                  className='rounded-lg border bg-background/90 px-3 py-2 shadow-xs backdrop-blur'
                >
                  <p className='text-xs font-medium tabular-nums'>
                    {nodes.length} 个节点 · {edges.length} 条连线
                  </p>
                  <p className='mt-0.5 hidden text-xs text-muted-foreground sm:block'>
                    点击节点右侧 + 号添加下一个节点；Delete 可删除选中项
                  </p>
                </Panel>
                <Panel position='top-right'>
                  <Button
                    type='button'
                    size='sm'
                    variant='outline'
                    onClick={fitCanvas}
                    className='bg-background/90 backdrop-blur'
                  >
                    <Maximize2 className='size-4' aria-hidden='true' />
                    适应画布
                  </Button>
                </Panel>
                <Panel
                  position='bottom-right'
                  className='flex flex-col items-end gap-2 lg:hidden'
                >
                  <Button
                    type='button'
                    size='sm'
                    disabled={!selectedNode}
                    onClick={() => setMobileConfigOpen(true)}
                  >
                    <PanelRight className='size-4' aria-hidden='true' />
                    配置节点
                  </Button>
                </Panel>
              </ReactFlow>
            </FlowActionsProvider>
          </div>

          <aside className='hidden w-72 shrink-0 border-s lg:block'>
            <NodeInspector
              node={selectedNode}
              onUpdate={updateSelectedNode}
              onDelete={deleteSelectedNode}
              onClose={deselectNode}
            />
          </aside>
        </div>
      </div>

      <Sheet open={mobileConfigOpen} onOpenChange={setMobileConfigOpen}>
        <SheetContent side='right' className='w-full gap-0 p-0 sm:max-w-sm'>
          <SheetHeader className='sr-only'>
            <SheetTitle>节点配置</SheetTitle>
            <SheetDescription>编辑所选节点的名称与参数</SheetDescription>
          </SheetHeader>
          <NodeInspector
            node={selectedNode}
            onUpdate={updateSelectedNode}
            onDelete={deleteSelectedNode}
            onClose={() => setMobileConfigOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </div>
  )
}

export function AgentFlow({ agentId }: { agentId: string }) {
  return (
    <ReactFlowProvider>
      <FlowEditor agentId={agentId} />
    </ReactFlowProvider>
  )
}
