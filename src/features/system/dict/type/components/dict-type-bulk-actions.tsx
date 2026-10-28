import { useMutation, useQueryClient } from '@tanstack/react-query'
import { type Table } from '@tanstack/react-table'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type SysDictTypeVo, deleteDictTypes } from '../../api'

type DictTypeBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DictTypeBulkActionsProps<TData>) {
  const queryClient = useQueryClient()
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const { mutate: remove, isPending } = useMutation({
    mutationFn: (dictIds: number[]) => deleteDictTypes(dictIds),
    onSuccess: () => {
      toast.success(`已删除 ${selectedRows.length} 个字典类型`)
      table.resetRowSelection()
      queryClient.invalidateQueries({ queryKey: ['system-dict-type-list'] })
    },
    onError: (error: Error) => toast.error(error.message || '删除失败'),
  })

  const handleDelete = () => {
    const dictIds = selectedRows.map(
      (row) => (row.original as SysDictTypeVo).dictId
    )
    if (!dictIds.length) return
    remove(dictIds)
  }

  return (
    <BulkActionsToolbar table={table} entityName='字典类型'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='destructive'
            size='icon'
            onClick={handleDelete}
            disabled={isPending}
            className='size-8'
            aria-label='删除选中字典类型'
            title='删除选中字典类型'
          >
            <Trash2 />
            <span className='sr-only'>删除选中字典类型</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>删除选中字典类型</p>
        </TooltipContent>
      </Tooltip>
    </BulkActionsToolbar>
  )
}
