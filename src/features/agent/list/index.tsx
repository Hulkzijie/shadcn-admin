import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Bot, Plus, Search as SearchIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { type AgentItem, type CreateAgentInput } from '../data/agent-types'
import {
  createAgent,
  deleteAgent,
  duplicateAgent,
  listAgents,
  updateAgent,
} from '../lib/agent-service'
import { AgentCard } from './components/agent-card'
import { CreateAgentDialog } from './components/create-agent-dialog'
import { RenameAgentDialog } from './components/rename-agent-dialog'

export function AgentList() {
  const navigate = useNavigate()
  const [agents, setAgents] = useState<AgentItem[]>(() => listAgents())
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [renameTarget, setRenameTarget] = useState<AgentItem | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<AgentItem | null>(null)

  const filteredAgents = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return agents
    return agents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(keyword) ||
        agent.description.toLowerCase().includes(keyword)
    )
  }, [agents, query])

  const refresh = () => setAgents(listAgents())

  const handleCreate = (input: CreateAgentInput) => {
    const agent = createAgent(input)
    refresh()
    toast.success('Agent 已创建', {
      description: '已生成空白编排，正在进入画布。',
    })
    void navigate({
      to: '/agents/$agentId/flow',
      params: { agentId: agent.id },
    })
  }

  const handleRename = (id: string, name: string) => {
    updateAgent(id, { name })
    refresh()
    setRenameTarget(null)
    toast.success('Agent 已重命名')
  }

  const handleDuplicate = (agent: AgentItem) => {
    duplicateAgent(agent.id)
    refresh()
    toast.success('已复制 Agent', {
      description: `包含「${agent.name}」的完整编排。`,
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deleteAgent(deleteTarget.id)
    refresh()
    setDeleteTarget(null)
    toast.success('Agent 已删除')
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>智能体</h2>
            <p className='text-muted-foreground'>
              创建 Agent，并为每个 Agent 维护独立的可视化编排。
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className='size-4' aria-hidden='true' />
            创建 Agent
          </Button>
        </div>

        {agents.length > 0 && (
          <div className='relative w-full max-w-sm'>
            <SearchIcon
              className='pointer-events-none absolute inset-s-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground'
              aria-hidden='true'
            />
            <Input
              type='search'
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder='搜索名称或描述'
              aria-label='搜索 Agent'
              className='ps-8'
            />
          </div>
        )}

        {agents.length === 0 ? (
          <div className='flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center'>
            <span className='flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
              <Bot className='size-6' aria-hidden='true' />
            </span>
            <h3 className='mt-4 text-base font-semibold'>还没有 Agent</h3>
            <p className='mt-1 max-w-sm text-sm text-pretty text-muted-foreground'>
              创建第一个 Agent，系统会自动为它生成一份空白编排画布。
            </p>
            <Button className='mt-4' onClick={() => setCreateOpen(true)}>
              <Plus className='size-4' aria-hidden='true' />
              创建 Agent
            </Button>
          </div>
        ) : filteredAgents.length === 0 ? (
          <p className='py-16 text-center text-sm text-muted-foreground'>
            没有匹配「{query.trim()}」的 Agent。
          </p>
        ) : (
          <ul className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
            {filteredAgents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onRename={setRenameTarget}
                onDuplicate={handleDuplicate}
                onDelete={setDeleteTarget}
              />
            ))}
          </ul>
        )}
      </Main>

      <CreateAgentDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />

      <RenameAgentDialog
        agent={renameTarget}
        onOpenChange={(open) => {
          if (!open) setRenameTarget(null)
        }}
        onRename={handleRename}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该 Agent？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后「{deleteTarget?.name}」及其编排画布将无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive text-white hover:bg-destructive/90'
              onClick={handleDelete}
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
