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
import { type SysTenantVo, deleteTenants } from '../api'

type TenantBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: TenantBulkActionsProps<TData>) {
  const queryClient = useQueryClient()
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const { mutate: remove, isPending } = useMutation({
    mutationFn: (ids: number[]) => deleteTenants(ids),
    onSuccess: () => {
      toast.success(`已删除 ${selectedRows.length} 个租户`)
      table.resetRowSelection()
      queryClient.invalidateQueries({ queryKey: ['system-tenant-list'] })
    },
    onError: (error: Error) => toast.error(error.message || '删除失败'),
  })

  const handleDelete = () => {
    const ids = selectedRows.map((row) => (row.original as SysTenantVo).id)
    if (!ids.length) return
    remove(ids)
  }

  return (
    <BulkActionsToolbar table={table} entityName='租户'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='destructive'
            size='icon'
            onClick={handleDelete}
            disabled={isPending}
            className='size-8'
            aria-label='删除选中租户'
            title='删除选中租户'
          >
            <Trash2 />
            <span className='sr-only'>删除选中租户</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>删除选中租户</p>
        </TooltipContent>
      </Tooltip>
    </BulkActionsToolbar>
  )
}
