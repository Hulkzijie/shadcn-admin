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
import { deleteTenantPackages, type SysTenantPackageVo } from '../api'

type TenantPackageBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: TenantPackageBulkActionsProps<TData>) {
  const queryClient = useQueryClient()
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const { mutate: remove, isPending } = useMutation({
    mutationFn: (ids: (number | string)[]) => deleteTenantPackages(ids),
    onSuccess: () => {
      toast.success(`已删除 ${selectedRows.length} 个租户套餐`)
      table.resetRowSelection()
      queryClient.invalidateQueries({
        queryKey: ['system-tenant-package-list'],
      })
    },
    onError: (error: Error) => toast.error(error.message || '删除失败'),
  })

  const handleDelete = () => {
    const ids = selectedRows.map(
      (row) => (row.original as SysTenantPackageVo).packageId
    )
    if (!ids.length) return
    remove(ids)
  }

  return (
    <BulkActionsToolbar table={table} entityName='租户套餐'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='destructive'
            size='icon'
            onClick={handleDelete}
            disabled={isPending}
            className='size-8'
            aria-label='删除选中租户套餐'
            title='删除选中租户套餐'
          >
            <Trash2 />
            <span className='sr-only'>删除选中租户套餐</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>删除选中租户套餐</p>
        </TooltipContent>
      </Tooltip>
    </BulkActionsToolbar>
  )
}
