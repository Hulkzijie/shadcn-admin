import { useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Plus, Search as SearchIcon, Workflow } from 'lucide-react'
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
import type { PipelineTemplate } from './data/pipeline-types'
import {
  createPipeline,
  deletePipeline,
  duplicatePipeline,
  listPipelines,
} from './lib/pipeline-service'
import { CreatePipelineDialog } from './components/create-pipeline-dialog'
import { PipelineCard } from './components/pipeline-card'

/** 入库编排模板列表，嵌入知识库页的「编排模板」标签页。 */
export function PipelineList() {
  const navigate = useNavigate()
  const [pipelines, setPipelines] = useState<PipelineTemplate[]>(() =>
    listPipelines()
  )
  const [query, setQuery] = useState('')
  const [createOpen, setCreateOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<PipelineTemplate | null>(
    null
  )

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase()
    if (!keyword) return pipelines
    return pipelines.filter(
      (pipeline) =>
        pipeline.name.toLowerCase().includes(keyword) ||
        pipeline.description.toLowerCase().includes(keyword)
    )
  }, [pipelines, query])

  const refresh = () => setPipelines(listPipelines())

  const handleCreate = (input: {
    name: string
    description: string
    dataType: PipelineTemplate['dataType']
  }) => {
    const pipeline = createPipeline(input)
    refresh()
    toast.success('编排已创建', {
      description: '已按数据类型生成默认链路，正在进入画布。',
    })
    void navigate({
      to: '/knowledge-base/pipelines/$pipelineId',
      params: { pipelineId: pipeline.id },
    })
  }

  const handleDuplicate = (pipeline: PipelineTemplate) => {
    duplicatePipeline(pipeline.id)
    refresh()
    toast.success('已复制编排', {
      description: `包含「${pipeline.name}」的完整链路与参数。`,
    })
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    deletePipeline(deleteTarget.id)
    refresh()
    setDeleteTarget(null)
    toast.success('编排已删除')
  }

  return (
    <>
      <div className='flex flex-wrap items-center justify-between gap-2'>
        {pipelines.length > 0 ? (
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
              aria-label='搜索入库编排'
              className='ps-8'
            />
          </div>
        ) : (
          <span />
        )}
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className='size-4' aria-hidden='true' />
          新建编排
        </Button>
      </div>

      {pipelines.length === 0 ? (
        <div className='flex flex-col items-center justify-center rounded-xl border border-dashed px-6 py-16 text-center'>
          <span className='flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary'>
            <Workflow className='size-6' aria-hidden='true' />
          </span>
          <h3 className='mt-4 text-base font-semibold'>还没有入库编排</h3>
          <p className='mt-1 max-w-sm text-sm text-pretty text-muted-foreground'>
            新建编排后，系统会按数据类型生成默认链路，可继续调整节点与参数。
          </p>
          <Button className='mt-4' onClick={() => setCreateOpen(true)}>
            <Plus className='size-4' aria-hidden='true' />
            新建编排
          </Button>
        </div>
      ) : filtered.length === 0 ? (
        <p className='py-16 text-center text-sm text-muted-foreground'>
          没有匹配「{query.trim()}」的编排。
        </p>
      ) : (
        <ul className='grid gap-4 md:grid-cols-2 xl:grid-cols-3'>
          {filtered.map((pipeline) => (
            <PipelineCard
              key={pipeline.id}
              pipeline={pipeline}
              onDuplicate={handleDuplicate}
              onDelete={setDeleteTarget}
            />
          ))}
        </ul>
      )}

      <CreatePipelineDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreate={handleCreate}
      />

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除该编排？</AlertDialogTitle>
            <AlertDialogDescription>
              删除后「{deleteTarget?.name}」的节点、连线与参数配置将无法恢复。
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
