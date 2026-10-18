import { type Table } from '@tanstack/react-table'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { DataTableBulkActions as BulkActionsToolbar } from '@/components/data-table'
import { type SysUserVo, deleteUsers } from '../api'

type UserBulkActionsProps<TData> = {
  table: Table<TData>
}

export function DataTableBulkActions<TData>({
  table,
}: UserBulkActionsProps<TData>) {
  const queryClient = useQueryClient()
  const selectedRows = table.getFilteredSelectedRowModel().rows

  const { mutate: remove, isPending } = useMutation({
    mutationFn: (userIds: number[]) => deleteUsers(userIds),
    onSuccess: () => {
      toast.success(`已删除 ${selectedRows.length} 个用户`)
      table.resetRowSelection()
      queryClient.invalidateQueries({ queryKey: ['system-user-list'] })
    },
    onError: (error: Error) => toast.error(error.message || '删除失败'),
  })

  const handleDelete = () => {
    const userIds = selectedRows.map((row) => (row.original as SysUserVo).userId)
    if (!userIds.length) return
    remove(userIds)
  }

  return (
    <BulkActionsToolbar table={table} entityName='用户'>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant='destructive'
            size='icon'
            onClick={handleDelete}
            disabled={isPending}
            className='size-8'
            aria-label='删除选中用户'
            title='删除选中用户'
          >
            <Trash2 />
            <span className='sr-only'>删除选中用户</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>删除选中用户</p>
        </TooltipContent>
      </Tooltip>
    </BulkActionsToolbar>
  )
}
