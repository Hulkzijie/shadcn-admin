import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
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
import {
  createKnowledgeBase,
  deleteKnowledgeBase,
  fetchKnowledgeBases,
  getIngestTasks,
} from './lib/knowledge-service'

export function KnowledgeBase() {
  const queryClient = useQueryClient()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // 当前查看入库进度的知识库
  const [progressTarget, setProgressTarget] =
    useState<KnowledgeBaseItem | null>(null)
  // 待删除确认的知识库
  const [deleteTarget, setDeleteTarget] = useState<KnowledgeBaseItem | null>(
    null
  )
  const [isDeleting, setIsDeleting] = useState(false)

  const {
    data: items = [],
    isPending,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['knowledge-bases'],
    queryFn: fetchKnowledgeBases,
  })

  const handleCreate = async (data: CreateKnowledgeBaseInput) => {
    try {
      setIsSubmitting(true)

      const item = await createKnowledgeBase(data)
      setProgressTarget(item)
      toast.success('知识库创建成功，正在入库处理')
      await refetch()
    } catch (error) {
      handleServerError(error)
      throw error
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    try {
      setIsDeleting(true)
      await deleteKnowledgeBase(deleteTarget.id)
      queryClient.setQueryData<KnowledgeBaseItem[]>(
        ['knowledge-bases'],
        (prev) => prev?.filter((item) => item.id !== deleteTarget.id)
      )
      toast.success('知识库已删除')
      setDeleteTarget(null)
    } catch (error) {
      handleServerError(error)
    } finally {
      setIsDeleting(false)
    }
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

        <KnowledgeBaseGrid
          items={items}
          isLoading={isPending}
          isError={isError}
          onDelete={setDeleteTarget}
          onViewProgress={setProgressTarget}
        />
      </Main>

      <CreateKnowledgeBaseDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onCreate={handleCreate}
        isSubmitting={isSubmitting}
      />

      <IngestProgressDialog
        open={!!progressTarget}
        onOpenChange={(open) => {
          if (!open) setProgressTarget(null)
        }}
        summaries={progressTarget ? getIngestTasks(progressTarget) : []}
        knowledgeBaseName={progressTarget?.name ?? ''}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该知识库？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后「{deleteTarget?.name}」及其已入库的数据将无法恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              disabled={isDeleting}
              className='bg-destructive text-white hover:bg-destructive/90'
              onClick={(event) => {
                // 阻止默认的关闭行为，等接口返回后再关闭
                event.preventDefault()
                void handleDelete()
              }}
            >
              {isDeleting ? '删除中…' : '删除'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
