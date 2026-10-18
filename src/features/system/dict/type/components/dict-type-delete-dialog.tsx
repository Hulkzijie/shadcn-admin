'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteDictTypes, type SysDictTypeVo } from '../../api'

type DictTypeDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: SysDictTypeVo
}

export function DictTypeDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: DictTypeDeleteDialogProps) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteDictTypes([currentRow.dictId]),
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['system-dict-type-list'] })
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
          删除字典类型
        </span>
      }
      desc={
        <p>
          确定要删除字典类型{' '}
          <span className='font-bold'>{currentRow.dictName}</span> 吗？
          <br />
          该操作不可恢复。
        </p>
      }
    />
  )
}
