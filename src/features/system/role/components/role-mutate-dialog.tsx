'use client'

import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SelectDropdown } from '@/components/select-dropdown'
import { Textarea } from '@/components/ui/textarea'
import { STATUS_OPTIONS } from '../../shared/constants'
import {
  addRole,
  getRole,
  updateRole,
  type SysRoleBo,
  type SysRoleVo,
} from '../api'

const roleSchema = z.object({
  roleName: z.string().min(1, '请输入角色名称').max(30, '最多 30 个字符'),
  roleKey: z.string().min(1, '请输入权限字符').max(100, '最多 100 个字符'),
  roleSort: z.number().int('显示顺序必须为整数'),
  status: z.string().min(1, '请选择状态'),
  remark: z.string().optional(),
})

type RoleForm = z.infer<typeof roleSchema>

type RoleMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: SysRoleVo
}

export function RoleMutateDialog({
  open,
  onOpenChange,
  currentRow,
}: RoleMutateDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  const form = useForm<RoleForm>({
    resolver: zodResolver(roleSchema),
    defaultValues: {
      roleName: '',
      roleKey: '',
      roleSort: 0,
      status: '0',
      remark: '',
    },
  })

  const { data: detail } = useQuery({
    queryKey: ['system-role-detail', currentRow?.roleId],
    queryFn: () => getRole(currentRow!.roleId),
    enabled: open && isEdit,
  })

  useEffect(() => {
    if (isEdit && detail) {
      form.reset({
        roleName: detail.roleName ?? '',
        roleKey: detail.roleKey ?? '',
        roleSort: detail.roleSort ?? 0,
        status: detail.status ?? '0',
        remark: detail.remark ?? '',
      })
    }
    if (!isEdit) {
      form.reset({
        roleName: '',
        roleKey: '',
        roleSort: 0,
        status: '0',
        remark: '',
      })
    }
  }, [isEdit, detail, form])

  const { mutate, isPending } = useMutation({
    mutationFn: (values: RoleForm) => {
      const payload: SysRoleBo = {
        roleId: currentRow?.roleId,
        roleName: values.roleName,
        roleKey: values.roleKey,
        roleSort: values.roleSort,
        status: values.status,
        remark: values.remark || undefined,
      }
      return isEdit ? updateRole(payload) : addRole(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? '修改成功' : '新增成功')
      queryClient.invalidateQueries({ queryKey: ['system-role-list'] })
      onOpenChange(false)
      form.reset()
    },
    onError: (error: Error) => toast.error(error.message || '保存失败'),
  })

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => {
        if (!state) form.reset()
        onOpenChange(state)
      }}
    >
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? '编辑角色' : '新增角色'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改角色信息后保存。' : '填写角色信息后保存。'}
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[70vh] overflow-y-auto py-1 pe-1'>
          <Form {...form}>
            <form
              id='role-form'
              onSubmit={form.handleSubmit((v) => mutate(v))}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='roleName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 text-end'>
                      角色名称
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入角色名称'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='roleKey'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 text-end'>
                      权限字符
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入权限字符'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='roleSort'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 text-end'>
                      显示顺序
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='请输入显示顺序'
                        className='col-span-4'
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ''
                              ? undefined
                              : e.target.valueAsNumber
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 text-end'>状态</FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      className='col-span-4'
                      items={STATUS_OPTIONS.map((o) => ({ ...o }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='remark'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 pt-2 text-end'>备注</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='请输入备注'
                        className='col-span-4 resize-none'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='role-form' disabled={isPending}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
