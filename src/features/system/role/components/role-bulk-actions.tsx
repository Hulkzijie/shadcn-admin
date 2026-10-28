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
import { type SysRoleVo, deleteRoles } from '../api'

type RoleBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: RoleBulkActionsProps<TData>) {
  const queryClient = useQueryClient()
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const { mutate: remove, isPending } = useMutation({
    mutationFn: (roleIds: number[]) => deleteRoles(roleIds),
    onSuccess: () => {
      toast.success(`已删除 ${selectedRows.length} 个角色`)
      table.resetRowSelection()
      queryClient.invalidateQueries({ queryKey: ['system-role-list'] })
    },
    onError: (error: Error) => toast.error(error.message || '删除失败'),
  })

  const handleDelete = () => {
    const roleIds = selectedRows.map(
      (row) => (row.original as SysRoleVo).roleId
    )
    if (!roleIds.length) return
    remove(roleIds)
  }

  return (
    <BulkActionsToolbar table={table} entityName='角色'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='destructive'
            size='icon'
            onClick={handleDelete}
            disabled={isPending}
            className='size-8'
            aria-label='删除选中角色'
            title='删除选中角色'
          >
            <Trash2 />
            <span className='sr-only'>删除选中角色</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>删除选中角色</p>
        </TooltipContent>
      </Tooltip>
    </BulkActionsToolbar>
  )
}
