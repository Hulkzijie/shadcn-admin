import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type DragEvent,
  type ReactNode,
} from 'react'
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
  type NodeTypes,
  type OnEdgesChange,
  type OnNodesChange,
} from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import {
  ArrowLeft,
  CircleAlert,
  Maximize2,
  PanelRight,
  Save,
  ShieldCheck,
  TriangleAlert,
  Upload,
  Workflow,
  type LucideIcon,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { ConfigDrawer } from '@/components/config-drawer'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  FlowActionsProvider,
  FlowRegistryProvider,
  toRegistryView,
} from './flow-context'
import { FlowNodeCard } from './flow-node'
import { NodeInspector } from './node-inspector'
import { NodePalette } from './node-palette'
import type {
  FlowDsl,
  FlowNode,
  FlowNodeDataBase,
  FlowRegistry,
  FlowValidationIssue,
} from './types'

const nodeTypes = { flow: FlowNodeCard } as unknown as NodeTypes

const defaultEdgeOptions = {
  type: 'smoothstep',
  markerEnd: { type: MarkerType.ArrowClosed },
  style: { strokeWidth: 1.5 },
} as const

export type FlowCanvasProps<
  TKind extends string,
  TData extends FlowNodeDataBase,
> = {
  title: string
  subtitle?: string
  backTo: string
  backLabel: string
  headerIcon?: LucideIcon
  registry: FlowRegistry<TKind, TData>
  initialDsl: FlowDsl<TData>
  /** 返回 false 表示保存失败。 */
  onSave: (dsl: FlowDsl<TData>) => boolean
  validate?: (dsl: FlowDsl<TData>) => FlowValidationIssue[]
  /** 发布当前已保存的内容；配置后画布会在校验通过且无未保存改动时触发。 */
  onPublish?: (dsl: FlowDsl<TData>) => void
  /** 头部操作区，例如「发布」。 */
  headerActions?: ReactNode
  /** 配置面板里的业务扩展区块。 */
  renderInspectorExtras?: (
    node: FlowNode<TData>,
    update: (patch: Partial<TData>) => void
  ) => ReactNode
}

function FlowCanvasInner<TKind extends string, TData extends FlowNodeDataBase>({
  title,
  subtitle,
  backTo,
  backLabel,
  headerIcon: HeaderIcon = Workflow,
  registry,
  initialDsl,
  onSave,
  validate,
  onPublish,
  headerActions,
  renderInspectorExtras,
}: FlowCanvasProps<TKind, TData>) {
  const { resolvedTheme } = useTheme()
  const { fitView, screenToFlowPosition, getNode, getNodes, getEdges } =
    useReactFlow<FlowNode<TData>, Edge>()

  const runtime = useMemo(
    () =>
      toRegistryView(
        registry as unknown as FlowRegistry<string, FlowNodeDataBase>
      ),
    [registry]
  )

  const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode<TData>>(
    initialDsl.nodes
  )
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>(initialDsl.edges)
  const [dirty, setDirty] = useState(false)
  const [mobileConfigOpen, setMobileConfigOpen] = useState(false)
  const [issues, setIssues] = useState<FlowValidationIssue[] | null>(null)

  const canvasRef = useRef<HTMLDivElement>(null)
  const selectedNode = nodes.find((node) => node.selected) ?? null

  // 只有结构或位置变化才标记为未保存，单纯选中节点不触发。
  const handleNodesChange: OnNodesChange<FlowNode<TData>> = (changes) => {
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

  const addNode = (kind: string, position?: { x: number; y: number }) => {
    const meta = runtime.meta[kind]
    if (!meta) return

    const rect = canvasRef.current?.getBoundingClientRect()
    const center =
      position ??
      screenToFlowPosition({
        x: rect ? rect.x + rect.width / 2 : window.innerWidth / 2,
        y: rect ? rect.y + rect.height / 2 : window.innerHeight / 2,
      })
    const offset = (nodes.length % 4) * 24

    const newNode = {
      id: `${kind}-${crypto.randomUUID().slice(0, 8)}`,
      type: 'flow',
      position: {
        x: center.x - 112 + offset,
        y: center.y - 44 + offset,
      },
      data: meta.createData() as TData,
      selected: true,
    } as FlowNode<TData>

    setNodes((current) => [
      ...current.map((node) => ({ ...node, selected: false })),
      newNode,
    ])
    setDirty(true)
  }

  const addNextNode = useCallback(
    (sourceNodeId: string, kind: string) => {
      const sourceNode = getNode(sourceNodeId)
      const meta = runtime.meta[kind]
      if (!sourceNode || !meta) return

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

      const newNode = {
        id: `${kind}-${crypto.randomUUID().slice(0, 8)}`,
        type: 'flow',
        position: { x: sourceNode.position.x + sourceWidth + gapX, y },
        data: meta.createData() as TData,
        selected: true,
      } as FlowNode<TData>

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
    [getEdges, getNode, getNodes, runtime, setEdges, setNodes]
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
    const kind = event.dataTransfer.getData(runtime.dragMime)
    if (!runtime.isKind(kind)) return
    addNode(kind, screenToFlowPosition({ x: event.clientX, y: event.clientY }))
  }

  const updateSelectedNode = (patch: Partial<TData>) => {
    if (!selectedNode) return
    const id = selectedNode.id
    setNodes((current) =>
      current.map((node) =>
        node.id === id ? { ...node, data: { ...node.data, ...patch } } : node
      )
    )
    setDirty(true)
  }

  const handleConfigChange = (key: string, value: unknown) => {
    if (!selectedNode) return
    const current = runtime.getConfig(selectedNode.data as FlowNodeDataBase)
    const patch = runtime.applyConfig(selectedNode.data as FlowNodeDataBase, {
      ...current,
      [key]: value,
    })
    updateSelectedNode(patch as Partial<TData>)
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

  const runValidate = () => {
    if (!validate) return
    setIssues(validate({ nodes, edges }))
  }

  const saveFlow = () => {
    const saved = onSave({ nodes, edges })
    if (!saved) {
      toast.error('保存失败', { description: '该编排可能已被删除' })
      return
    }
    setDirty(false)
    toast.success('编排已保存', {
      description: `${nodes.length} 个节点，${edges.length} 条连线`,
    })
  }

  /** 发布前先跑强校验，阻断项未清零或存在未保存改动时不放行。 */
  const publishFlow = () => {
    if (!onPublish) return
    if (dirty) {
      toast.error('请先保存草稿再发布', {
        description: '发布会把最近一次保存的内容固化成一个新版本。',
      })
      return
    }
    const current = validate ? validate({ nodes, edges }) : []
    if (current.some((issue) => issue.level === 'error')) {
      setIssues(current)
      toast.error('校验未通过，暂时无法发布', {
        description: '请先修复阻断项，再重新发布。',
      })
      return
    }
    onPublish({ nodes, edges })
  }

  const inspectorNode = selectedNode
    ? {
        id: selectedNode.id,
        data: selectedNode.data as FlowNodeDataBase,
      }
    : null
  const inspectorMeta = selectedNode
    ? (runtime.meta[selectedNode.data.kind] as
        | (typeof runtime.meta)[string]
        | undefined)
    : undefined
  const inspectorFields = selectedNode
    ? (runtime.configSchema?.[selectedNode.data.kind] ?? [])
    : []
  const inspectorConfig = selectedNode
    ? runtime.getConfig(selectedNode.data as FlowNodeDataBase)
    : {}
  const inspectorExtras =
    selectedNode && renderInspectorExtras
      ? renderInspectorExtras(selectedNode, updateSelectedNode)
      : null

  const errorCount =
    issues?.filter((issue) => issue.level === 'error').length ?? 0
  const warningCount = issues?.length ? issues.length - errorCount : 0

  return (
    <div className='flex h-svh w-full min-w-0 touch-manipulation flex-col overflow-hidden bg-background'>
      <header className='flex h-14 shrink-0 items-center gap-2 border-b bg-background px-2 sm:px-4'>
        <Button
          asChild
          size='icon'
          variant='ghost'
          aria-label={backLabel}
          className='rounded-full'
        >
          <Link to={backTo as string}>
            <ArrowLeft aria-hidden='true' />
          </Link>
        </Button>
        <span className='flex size-8 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary'>
          <HeaderIcon className='size-4' aria-hidden='true' />
        </span>
        <div className='min-w-0 flex-1'>
          <div className='flex items-center gap-2'>
            <h1 className='truncate text-sm font-semibold'>{title}</h1>
            <Badge variant={dirty ? 'secondary' : 'outline'}>
              {dirty ? '未保存' : '已保存'}
            </Badge>
          </div>
          <p className='truncate text-xs text-muted-foreground'>
            {subtitle ?? '拖拽节点、连接流程，保存后写入编排'}
          </p>
        </div>

        <div className='flex shrink-0 items-center gap-1'>
          {headerActions}
          {validate ? (
            <Button
              type='button'
              variant='ghost'
              size='sm'
              onClick={runValidate}
              className='px-2 sm:px-3'
            >
              <ShieldCheck className='size-4' aria-hidden='true' />
              <span className='hidden sm:inline'>校验</span>
            </Button>
          ) : null}
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
          {onPublish ? (
            <Button
              type='button'
              variant='outline'
              size='sm'
              onClick={publishFlow}
              className='px-2 sm:px-3'
            >
              <Upload className='size-4' aria-hidden='true' />
              <span className='hidden sm:inline'>发布</span>
            </Button>
          ) : null}
        </div>
      </header>

      <div className='flex min-h-0 flex-1 flex-col lg:flex-row'>
        <NodePalette registry={runtime} onAdd={(kind) => addNode(kind)} />

        <div className='flex min-h-0 min-w-0 flex-1 flex-col lg:flex-row'>
          <div
            ref={canvasRef}
            onDrop={onDrop}
            onDragOver={onDragOver}
            className='relative min-h-0 flex-1 bg-muted/20'
          >
            <FlowRegistryProvider value={runtime}>
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
            </FlowRegistryProvider>
          </div>

          <aside className='hidden w-72 shrink-0 border-s lg:block'>
            <NodeInspector
              node={inspectorNode}
              meta={inspectorMeta}
              fields={inspectorFields}
              config={inspectorConfig}
              onUpdate={(patch) => updateSelectedNode(patch as Partial<TData>)}
              onConfigChange={handleConfigChange}
              onDelete={deleteSelectedNode}
              onClose={deselectNode}
              extras={inspectorExtras}
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
            node={inspectorNode}
            meta={inspectorMeta}
            fields={inspectorFields}
            config={inspectorConfig}
            onUpdate={(patch) => updateSelectedNode(patch as Partial<TData>)}
            onConfigChange={handleConfigChange}
            onDelete={deleteSelectedNode}
            onClose={() => setMobileConfigOpen(false)}
            extras={inspectorExtras}
          />
        </SheetContent>
      </Sheet>

      <Dialog
        open={issues !== null}
        onOpenChange={(open) => !open && setIssues(null)}
      >
        <DialogContent className='sm:max-w-lg'>
          <DialogHeader>
            <DialogTitle>编排校验</DialogTitle>
            <DialogDescription>
              {issues && issues.length > 0
                ? `发现 ${errorCount} 个阻断项、${warningCount} 个警告项。阻断项需修复后才能发布。`
                : '未发现结构性问题，可以保存并发布。'}
            </DialogDescription>
          </DialogHeader>
          <div className='max-h-80 space-y-2 overflow-y-auto'>
            {issues?.length ? null : (
              <p className='rounded-lg border border-dashed px-3 py-6 text-center text-sm text-muted-foreground'>
                校验通过
              </p>
            )}
            {issues?.map((issue, index) => (
              <div
                key={`${issue.message}-${index}`}
                className={cn(
                  'flex items-start gap-2 rounded-lg border px-3 py-2 text-sm',
                  issue.level === 'error'
                    ? 'border-destructive/30 bg-destructive/5'
                    : 'border-amber-500/30 bg-amber-500/5'
                )}
              >
                {issue.level === 'error' ? (
                  <CircleAlert className='mt-0.5 size-4 shrink-0 text-destructive' />
                ) : (
                  <TriangleAlert className='mt-0.5 size-4 shrink-0 text-amber-600 dark:text-amber-400' />
                )}
                <span className='min-w-0 flex-1 text-pretty'>
                  {issue.message}
                </span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/** 通用编排画布，业务侧只需提供注册表、初始 DSL 与保存逻辑。 */
export function FlowCanvas<
  TKind extends string,
  TData extends FlowNodeDataBase,
>(props: FlowCanvasProps<TKind, TData>) {
  return (
    <ReactFlowProvider>
      <FlowCanvasInner {...props} />
    </ReactFlowProvider>
  )
}
