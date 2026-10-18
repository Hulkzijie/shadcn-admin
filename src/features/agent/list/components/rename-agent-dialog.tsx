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
import type { AgentItem } from '../../data/agent-types'

type RenameAgentDialogProps = {
  agent: AgentItem | null
  onOpenChange: (open: boolean) => void
  onRename: (id: string, name: string) => void
}

type RenameAgentFormProps = {
  agent: AgentItem
  onOpenChange: (open: boolean) => void
  onRename: (id: string, name: string) => void
}

function RenameAgentForm({
  agent,
  onOpenChange,
  onRename,
}: RenameAgentFormProps) {
  const [name, setName] = useState(agent.name)

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed) return

    onRename(agent.id, trimmed)
  }

  return (
    <form onSubmit={handleSubmit} className='space-y-4'>
      <DialogHeader>
        <DialogTitle>重命名 Agent</DialogTitle>
        <DialogDescription>
          修改后的名称会同步显示在列表和编排画布中。
        </DialogDescription>
      </DialogHeader>

      <div className='space-y-2'>
        <Label htmlFor='agent-rename'>名称</Label>
        <Input
          id='agent-rename'
          autoFocus
          maxLength={40}
          value={name}
          onChange={(event) => setName(event.target.value)}
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
          保存
        </Button>
      </DialogFooter>
    </form>
  )
}

export function RenameAgentDialog({
  agent,
  onOpenChange,
  onRename,
}: RenameAgentDialogProps) {
  return (
    <Dialog open={!!agent} onOpenChange={onOpenChange}>
      <DialogContent>
        {agent && (
          <RenameAgentForm
            key={agent.id}
            agent={agent}
            onOpenChange={onOpenChange}
            onRename={onRename}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
