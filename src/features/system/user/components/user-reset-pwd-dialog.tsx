'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/password-input'
import { resetUserPwd, type SysUserVo } from '../api'

type UserResetPwdDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: SysUserVo
}

export function UserResetPwdDialog({
  open,
  onOpenChange,
  currentRow,
}: UserResetPwdDialogProps) {
  const [password, setPassword] = useState('')

  const { mutate, isPending } = useMutation({
    mutationFn: () => resetUserPwd(currentRow.userId, password),
    onSuccess: () => {
      toast.success('密码重置成功')
      setPassword('')
      onOpenChange(false)
    },
    onError: (error: Error) => toast.error(error.message || '重置失败'),
  })

  const disabled = password.length < 6

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) setPassword('')
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-md'>
        <DialogHeader className='text-start'>
          <DialogTitle>重置密码</DialogTitle>
          <DialogDescription>
            为用户 <span className='font-bold'>{currentRow.userName}</span>{' '}
            设置新密码。
          </DialogDescription>
        </DialogHeader>
        <div className='space-y-2 py-2'>
          <Label htmlFor='user-reset-password'>新密码</Label>
          <PasswordInput
            id='user-reset-password'
            placeholder='请输入新密码'
            autoComplete='new-password'
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button disabled={disabled || isPending} onClick={() => mutate()}>
            确定
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
