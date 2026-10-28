import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CircleCheck, CircleSlash, Pencil, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { changeTenantPackageStatus, type SysTenantPackageVo } from '../api'
import { useTenantPackage } from './tenant-package-provider'

type DataTableRowActionsProps = {
  row: Row<SysTenantPackageVo>
}

export function DataTableRowActions({ row }: DataTableRowActionsProps) {
  const { setOpen, setCurrentRow } = useTenantPackage()
  const queryClient = useQueryClient()
  const record = row.original
  const enabled = record.status === '0'

  const { mutate: toggleStatus, isPending } = useMutation({
    mutationFn: () =>
      changeTenantPackageStatus(record.packageId, enabled ? '1' : '0'),
    onSuccess: () => {
      toast.success(enabled ? '停用成功' : '启用成功')
      queryClient.invalidateQueries({ queryKey: ['system-tenant-package-list'] })
    },
    onError: (error: Error) => toast.error(error.message || '操作失败'),
  })

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button
          variant='ghost'
          className='flex h-8 w-8 p-0 data-[state=open]:bg-muted'
        >
          <DotsHorizontalIcon className='h-4 w-4' />
          <span className='sr-only'>Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-40'>
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(record)
            setOpen('edit')
          }}
        >
          编辑
          <DropdownMenuShortcut>
            <Pencil size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuItem disabled={isPending} onClick={() => toggleStatus()}>
          {enabled ? '停用' : '启用'}
          <DropdownMenuShortcut>
            {enabled ? <CircleSlash size={16} /> : <CircleCheck size={16} />}
          </DropdownMenuShortcut>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => {
            setCurrentRow(record)
            setOpen('delete')
          }}
          className='text-red-500!'
        >
          删除
          <DropdownMenuShortcut>
            <Trash2 size={16} />
          </DropdownMenuShortcut>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
