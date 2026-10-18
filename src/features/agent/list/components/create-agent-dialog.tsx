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
import { Textarea } from '@/components/ui/textarea'
import type { CreateAgentInput } from '../../data/agent-types'

type CreateAgentDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreate: (input: CreateAgentInput) => void
}

export function CreateAgentDialog({
  open,
  onOpenChange,
  onCreate,
}: CreateAgentDialogProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const reset = () => {
    setName('')
    setDescription('')
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    onCreate({ name: trimmed, description: description.trim() })
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
            <DialogTitle>创建 Agent</DialogTitle>
            <DialogDescription>
              创建后会自动生成一份空白编排，可随时进入画布继续设计流程。
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-2'>
            <Label htmlFor='agent-name'>名称</Label>
            <Input
              id='agent-name'
              autoFocus
              maxLength={40}
              placeholder='例如：售后助手'
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </div>

          <div className='space-y-2'>
            <Label htmlFor='agent-description'>描述</Label>
            <Textarea
              id='agent-description'
              rows={3}
              placeholder='简要说明这个 Agent 的用途与能力'
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
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
