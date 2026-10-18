'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteRoles, type SysRoleVo } from '../api'

type RoleDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: SysRoleVo
}

export function RoleDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: RoleDeleteDialogProps) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteRoles([currentRow.roleId]),
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['system-role-list'] })
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
          删除角色
        </span>
      }
      desc={
        <p>
          确定要删除角色{' '}
          <span className='font-bold'>{currentRow.roleName}</span> 吗？
          <br />
          该操作不可恢复。
        </p>
      }
    />
  )
}
