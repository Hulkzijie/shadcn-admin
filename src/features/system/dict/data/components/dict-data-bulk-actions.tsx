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
import { type SysDictDataVo, deleteDictData } from '../../api'

type DictDataBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: DictDataBulkActionsProps<TData>) {
  const queryClient = useQueryClient()
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const { mutate: remove, isPending } = useMutation({
    mutationFn: (dictCodes: number[]) => deleteDictData(dictCodes),
    onSuccess: () => {
      toast.success(`已删除 ${selectedRows.length} 个字典数据`)
      table.resetRowSelection()
      queryClient.invalidateQueries({ queryKey: ['system-dict-data-list'] })
    },
    onError: (error: Error) => toast.error(error.message || '删除失败'),
  })

  const handleDelete = () => {
    const dictCodes = selectedRows.map(
      (row) => (row.original as SysDictDataVo).dictCode
    )
    if (!dictCodes.length) return
    remove(dictCodes)
  }

  return (
    <BulkActionsToolbar table={table} entityName='字典数据'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='destructive'
            size='icon'
            onClick={handleDelete}
            disabled={isPending}
            className='size-8'
            aria-label='删除选中字典数据'
            title='删除选中字典数据'
          >
            <Trash2 />
            <span className='sr-only'>删除选中字典数据</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>删除选中字典数据</p>
        </TooltipContent>
      </Tooltip>
    </BulkActionsToolbar>
  )
}
