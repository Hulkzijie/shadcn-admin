'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteMenu, type SysMenuVo } from '../api'

type MenuDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: SysMenuVo
}

export function MenuDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: MenuDeleteDialogProps) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteMenu(currentRow.menuId),
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['system-menu-list'] })
      queryClient.invalidateQueries({ queryKey: ['system-menu-treeselect'] })
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message || '删除失败'),
  })

  return (
    <ConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      isLoading={isPending}
      handleConfirm={() => mutate()}
      destructive
      confirmText='删除'
      cancelBtnText='取消'
      title={
        <span className='text-destructive'>
          <AlertTriangle
            className='me-1 inline-block stroke-destructive'
            size={18}
          />{' '}
          删除菜单
        </span>
      }
      desc={
        <p>
          确定要删除菜单 <span className='font-bold'>{currentRow.menuName}</span>{' '}
          吗？
          <br />
          该操作不可恢复。
        </p>
      }
    />
  )
}
