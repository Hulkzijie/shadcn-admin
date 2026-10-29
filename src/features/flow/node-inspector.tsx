import type { ReactNode } from 'react'
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
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import type {
  ConfigFieldSchema,
  FlowNodeDataBase,
  NodeKindMeta,
} from './types'

type FieldProps = {
  field: ConfigFieldSchema
  value: unknown
  onChange: (value: unknown) => void
}

function ConfigField({ field, value, onChange }: FieldProps) {
  const id = `node-config-${field.key}`

  if (field.type === 'switch') {
    return (
      <div className='flex items-start justify-between gap-3'>
        <div className='min-w-0'>
          <Label htmlFor={id}>{field.label}</Label>
          {field.hint ? (
            <p className='mt-1 text-xs text-pretty text-muted-foreground'>
              {field.hint}
            </p>
          ) : null}
        </div>
        <Switch
          id={id}
          checked={value === true}
          onCheckedChange={(checked) => onChange(checked)}
        />
      </div>
    )
  }

  return (
    <div className='flex flex-col gap-2'>
      <Label htmlFor={id}>{field.label}</Label>
      {field.type === 'text' ? (
        <Input
          id={id}
          value={typeof value === 'string' ? value : ''}
          placeholder={field.placeholder}
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}
      {field.type === 'textarea' ? (
        <Textarea
          id={id}
          value={typeof value === 'string' ? value : ''}
          placeholder={field.placeholder}
          rows={field.rows ?? 3}
          className='resize-none'
          onChange={(event) => onChange(event.target.value)}
        />
      ) : null}
      {field.type === 'number' ? (
        <div className='relative'>
          <Input
            id={id}
            type='number'
            inputMode='numeric'
            value={typeof value === 'number' ? String(value) : ''}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            className={field.unit ? 'pe-12' : undefined}
            onChange={(event) => {
              const next = event.target.value
              onChange(next === '' ? '' : Number(next))
            }}
          />
          {field.unit ? (
            <span className='pointer-events-none absolute inset-y-0 end-3 flex items-center text-xs text-muted-foreground'>
              {field.unit}
            </span>
          ) : null}
        </div>
      ) : null}
      {field.type === 'select' ? (
        <Select
          value={typeof value === 'string' ? value : ''}
          onValueChange={(next) => onChange(next)}
        >
          <SelectTrigger id={id} className='w-full'>
            <SelectValue placeholder={field.placeholder ?? `选择${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : null}
      {field.hint ? (
        <p className='text-xs text-pretty text-muted-foreground'>{field.hint}</p>
      ) : null}
    </div>
  )
}

export type NodeInspectorProps = {
  node: { id: string; data: FlowNodeDataBase } | null
  meta?: NodeKindMeta<FlowNodeDataBase>
  fields: ConfigFieldSchema[]
  config: Record<string, unknown>
  onUpdate: (patch: { label?: string; description?: string }) => void
  onConfigChange: (key: string, value: unknown) => void
  onDelete: () => void
  onClose: () => void
  /** 业务自定义的扩展配置区块（如失败策略、重试）。 */
  extras?: ReactNode
  className?: string
}

export function NodeInspector({
  node,
  meta,
  fields,
  config,
  onUpdate,
  onConfigChange,
  onDelete,
  onClose,
  extras,
  className,
}: NodeInspectorProps) {
  if (!node || !meta) {
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
        <section className='flex flex-col gap-4'>
          <p className='text-[11px] font-medium tracking-wide text-muted-foreground uppercase'>
            基础
          </p>
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
        </section>

        {fields.length > 0 ? (
          <section className='flex flex-col gap-4 border-t pt-4'>
            <p className='text-[11px] font-medium tracking-wide text-muted-foreground uppercase'>
              参数
            </p>
            {fields.map((field) => (
              <ConfigField
                key={field.key}
                field={field}
                value={config[field.key]}
                onChange={(value) => onConfigChange(field.key, value)}
              />
            ))}
          </section>
        ) : null}

        {extras}

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
