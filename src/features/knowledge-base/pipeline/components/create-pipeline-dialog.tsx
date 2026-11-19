import { useState, type SubmitEvent } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
  dataTypeOptions,
  type KnowledgeDataType,
} from '../../data/knowledge-types'
import type { PipelineExecutor } from '../data/pipeline-types'

export type CreatePipelineInput = {
  name: string
  description: string
  dataType: KnowledgeDataType
  executor: PipelineExecutor
}

type CreatePipelineDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: CreatePipelineInput) => void
}

export function CreatePipelineDialog({
  open,
  onOpenChange,
  onCreate,
}: CreatePipelineDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [dataType, setDataType] = useState<KnowledgeDataType>('unstructured')
  const [executor, setExecutor] = useState<PipelineExecutor>('native')

  const reset = () => {
    setName('')
    setDescription('')
    setDataType('unstructured')
    setExecutor('native')
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    onCreate({ name: trimmed, description: description.trim(), dataType, executor })
    reset()
    onOpenChange(false)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) reset()
        onOpenChange(nextOpen)
      }}
    >
      <DialogContent>
        <form onSubmit={handleSubmit} className='space-y-4'>
          <DialogHeader>
            <DialogTitle>新建入库编排</DialogTitle>
            <DialogDescription>
              按数据类型生成默认链路，创建后可进入画布调整节点与参数。
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-2'>
            <Label htmlFor='pipeline-name'>名称</Label>
            <Input
              id='pipeline-name'
              autoFocus
              maxLength={40}
              placeholder='例如：制度文档标准入库'
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='pipeline-data-type'>数据类型</Label>
            <Select
              value={dataType}
              onValueChange={(value) => setDataType(value as KnowledgeDataType)}
            >
              <SelectTrigger id='pipeline-data-type' className='w-full'>
                <SelectValue placeholder='选择数据类型' />
              </SelectTrigger>
              <SelectContent>
                {dataTypeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              {dataTypeOptions.find((option) => option.value === dataType)
                ?.description}
            </p>
          </div>

          <div className='space-y-2'>
            <Label htmlFor='pipeline-description'>描述</Label>
            <Textarea
              id='pipeline-description'
              rows={3}
              placeholder='简要说明这条编排适用的数据与场景'
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='pipeline-executor'>执行引擎</Label>
            <Select
              value={executor}
              onValueChange={(value) => setExecutor(value as PipelineExecutor)}
            >
              <SelectTrigger id='pipeline-executor' className='w-full'>
                <SelectValue placeholder='选择执行引擎' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='native'>自研执行引擎</SelectItem>
                <SelectItem value='langgraph'>LangGraph</SelectItem>
              </SelectContent>
            </Select>
            <p className='text-xs text-muted-foreground'>
              {executor === 'native'
                ? '轻量级自研引擎，完全可控，支持条件分支、重试、人工审核'
                : 'LangGraph 图执行引擎，适用于复杂状态编排'}
            </p>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
            <Button type='submit' disabled={!name.trim()}>
              创建并编排
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
