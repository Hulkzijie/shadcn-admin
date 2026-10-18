'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { deleteDictData, type SysDictDataVo } from '../../api'

type DictDataDeleteDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: SysDictDataVo
}

export function DictDataDeleteDialog({
  open,
  onOpenChange,
  currentRow,
}: DictDataDeleteDialogProps) {
  const queryClient = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => deleteDictData([currentRow.dictCode]),
    onSuccess: () => {
      toast.success('删除成功')
      queryClient.invalidateQueries({ queryKey: ['system-dict-data-list'] })
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
          删除字典数据
        </span>
      }
      desc={
        <p>
          确定要删除字典数据{' '}
          <span className='font-bold'>{currentRow.dictLabel}</span> 吗？
          <br />
          该操作不可恢复。
        </p>
      }
    />
  )
}
