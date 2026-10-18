import { MousePointerClick, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  NODE_KIND_META,
  type AgentFlowNode,
  type FlowNodeData,
  type NodeKind,
} from './data/flow-presets'

const LLM_MODELS = ['DeepSeek-V3', 'GPT-4.1', 'Claude Sonnet 4', 'Qwen-Max']
const KNOWLEDGE_BASES = ['售后知识库', '产品手册', '内部 FAQ']
const TOOLS = ['订单查询 API', '库存查询 API', '工单创建 API']

type ConfigFieldProps = {
  kind: NodeKind
  value: string
  onChange: (value: string) => void
}

/** 按节点类型渲染不同的配置项。 */
function ConfigField({ kind, value, onChange }: ConfigFieldProps) {
  if (kind === 'condition') {
    return (
      <div className='flex flex-col gap-2'>
        <Label htmlFor='node-config'>条件表达式</Label>
        <Input
          id='node-config'
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder='例如：intent = 售后'
          className='font-mono'
        />
      </div>
    )
  }

  const options =
    kind === 'llm'
      ? { label: '模型', items: LLM_MODELS }
      : kind === 'knowledge'
        ? { label: '知识库', items: KNOWLEDGE_BASES }
        : kind === 'tool'
          ? { label: '工具', items: TOOLS }
          : null

  if (!options) return null

  return (
    <div className='flex flex-col gap-2'>
      <Label htmlFor='node-config'>{options.label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id='node-config' className='w-full'>
          <SelectValue placeholder={`选择${options.label}`} />
        </SelectTrigger>
        <SelectContent>
          {options.items.map((item) => (
            <SelectItem key={item} value={item}>
              {item}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

type NodeInspectorProps = {
  node: AgentFlowNode | null
  onUpdate: (patch: Partial<FlowNodeData>) => void
  onDelete: () => void
  onClose: () => void
  className?: string
}

export function NodeInspector({
  node,
  onUpdate,
  onDelete,
  onClose,
  className,
}: NodeInspectorProps) {
  if (!node) {
    return (
      <div
        className={cn(
          'flex h-full w-full flex-col items-center justify-center gap-3 bg-background px-6 text-center',
          className
        )}
      >
        <span className='flex size-11 items-center justify-center rounded-xl bg-muted text-muted-foreground'>
          <MousePointerClick className='size-5' aria-hidden='true' />
        </span>
        <div>
          <p className='text-sm font-medium'>未选中节点</p>
          <p className='mt-1 text-xs text-pretty text-muted-foreground'>
            在画布中点击节点，即可在这里编辑名称、说明与参数。
          </p>
        </div>
      </div>
    )
  }

  const meta = NODE_KIND_META[node.data.kind]
  const Icon = meta.icon

  return (
    <div className={cn('flex h-full w-full flex-col bg-background', className)}>
      <header className='flex items-center gap-2 border-b px-3 py-2.5'>
        <span
          className={cn(
            'flex size-7 shrink-0 items-center justify-center rounded-md',
            meta.iconClassName
          )}
        >
          <Icon className='size-3.5' aria-hidden='true' />
        </span>
        <div className='min-w-0 flex-1'>
          <h2 className='truncate text-sm font-semibold'>节点配置</h2>
          <p className='truncate text-xs text-muted-foreground'>{meta.label}</p>
        </div>
        <Button
          type='button'
          size='icon'
          variant='ghost'
          className='size-7'
          aria-label='关闭节点配置'
          onClick={onClose}
        >
          <X className='size-4' aria-hidden='true' />
        </Button>
      </header>

      <div className='flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='node-label'>节点名称</Label>
          <Input
            id='node-label'
            value={node.data.label}
            onChange={(event) => onUpdate({ label: event.target.value })}
            placeholder='给这个节点起个名字'
          />
        </div>

        <div className='flex flex-col gap-2'>
          <Label htmlFor='node-description'>说明</Label>
          <Textarea
            id='node-description'
            value={node.data.description}
            onChange={(event) => onUpdate({ description: event.target.value })}
            placeholder='描述这个节点负责什么'
            className='min-h-20 resize-none'
          />
        </div>

        <ConfigField
          kind={node.data.kind}
          value={node.data.config}
          onChange={(config) => onUpdate({ config })}
        />

        <div className='mt-auto flex flex-col gap-1 border-t pt-4'>
          <span className='text-xs text-muted-foreground'>节点 ID</span>
          <code className='truncate rounded-md bg-muted px-2 py-1 font-mono text-xs text-muted-foreground'>
            {node.id}
          </code>
        </div>
      </div>

      <footer className='border-t p-3'>
        <Button
          type='button'
          variant='outline'
          className='w-full text-destructive hover:text-destructive'
          onClick={onDelete}
        >
          <Trash2 aria-hidden='true' />
          删除节点
        </Button>
      </footer>
    </div>
  )
}
