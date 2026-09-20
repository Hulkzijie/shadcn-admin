import { useState } from 'react'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { CreateKnowledgeBaseDialog } from './components/create-knowledge-base-dialog'
import { IngestProgressDialog } from './components/ingest-progress-dialog'
import { KnowledgeBaseGrid } from './components/knowledge-base-grid'
import {
  type CreateKnowledgeBaseInput,
  type KnowledgeBaseItem,
} from './data/knowledge-types'
import { createKnowledgeBase } from './lib/knowledge-service'

export function KnowledgeBase() {
  const [items, setItems] = useState<KnowledgeBaseItem[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // 创建成功后进入入库流程的知识库，用于展示节点进度
  const [ingesting, setIngesting] = useState<KnowledgeBaseItem | null>(null)

  const handleCreate = async (data: CreateKnowledgeBaseInput) => {
    try {
      setIsSubmitting(true)

      const item = await createKnowledgeBase(data)
      setItems((prev) => [item, ...prev])
      setIngesting(item)
      toast.success('知识库创建成功，正在入库处理')
    } catch (error) {
      handleServerError(error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id))
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
            <h2 className='text-2xl font-bold tracking-tight'>知识库</h2>
            <p className='text-muted-foreground'>
              创建并管理你的知识库，为智能应用提供数据支撑。
            </p>
          </div>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className='size-4' />
            创建知识库
          </Button>
        </div>

        <KnowledgeBaseGrid items={items} onDelete={handleDelete} />
      </Main>

      <CreateKnowledgeBaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
        isSubmitting={isSubmitting}
      />

      <IngestProgressDialog
        open={!!ingesting}
        onOpenChange={(open) => {
          if (!open) setIngesting(null)
        }}
        knowledgeBaseId={ingesting?.id ?? null}
        knowledgeBaseName={ingesting?.name ?? ''}
      />
    </>
  )
}
