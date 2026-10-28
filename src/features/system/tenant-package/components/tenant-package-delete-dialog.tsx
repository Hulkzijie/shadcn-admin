'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteTenantPackages, type SysTenantPackageVo } from '../api'

type TenantPackageDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: SysTenantPackageVo
}

export function TenantPackageDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: TenantPackageDeleteDialogProps) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteTenantPackages([currentRow.packageId]),
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['system-tenant-package-list'] })
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
          删除租户套餐
        </span>
      }
      desc={
        <p>
          确定要删除租户套餐{' '}
          <span className='font-bold'>{currentRow.packageName}</span> 吗？
          <br />
          该操作不可恢复。
        </p>
      }
    />
  )
}
