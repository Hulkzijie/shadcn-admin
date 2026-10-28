'use client'

import { useEffect } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { PasswordInput } from '@/components/password-input'
import { SelectDropdown } from '@/components/select-dropdown'
import { flattenTree } from '../../shared/api'
import {
  addUser,
  deptTree,
  getUserInfo,
  roleOptions,
  updateUser,
  type SysUserVo,
} from '../api'

const makeSchema = (isEdit: boolean) =>
  z.object({
    userName: z.string().min(1, '请输入用户名').max(30, '最多 30 个字符'),
    nickName: z.string().min(1, '请输入昵称').max(30, '最多 30 个字符'),
    deptId: z.string().optional(),
    phonenumber: z.string().optional(),
    email: z.string().optional(),
    sex: z.string().optional(),
    status: z.string().min(1, '请选择状态'),
    password: z
      .string()
      .optional()
      .refine((v) => isEdit || (v != null && v.length >= 6), {
        message: '密码至少 6 位',
      }),
    roleIds: z.array(z.number()).min(1, '请至少选择一个角色'),
    remark: z.string().optional(),
  })

type UserForm = z.infer<ReturnType<typeof makeSchema>>

type UserMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: SysUserVo
}

export function UserMutateDialog({
  open,
  onOpenChange,
  currentRow,
}: UserMutateDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  const form = useForm<UserForm>({
    resolver: zodResolver(makeSchema(isEdit)),
    defaultValues: {
      userName: '',
      nickName: '',
      deptId: undefined,
      phonenumber: '',
      email: '',
      sex: '2',
      status: '0',
      password: '',
      roleIds: [],
      remark: '',
    },
  })

  const { data: deptOptions } = useQuery({
    queryKey: ['system-dept-tree'],
    queryFn: deptTree,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  const { data: roleList } = useQuery({
    queryKey: ['system-role-options'],
    queryFn: roleOptions,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  // 后端会把 Long 序列化成字符串，这里统一转成 number，避免角色校验失败
  const roles = (roleList ?? []).map((role) => ({
    ...role,
    roleId: Number(role.roleId),
  }))

  const { data: detail } = useQuery({
    queryKey: ['system-user-detail', currentRow?.userId],
    queryFn: () => getUserInfo(currentRow!.userId),
    enabled: open && isEdit,
  })

  useEffect(() => {
    if (isEdit && detail) {
      form.reset({
        userName: detail.user?.userName ?? '',
        nickName: detail.user?.nickName ?? '',
        deptId:
          detail.user?.deptId !== undefined
            ? String(detail.user.deptId)
            : undefined,
        phonenumber: detail.user?.phonenumber ?? '',
        email: detail.user?.email ?? '',
        sex: detail.user?.sex ?? '2',
        status: detail.user?.status ?? '0',
        password: '',
        roleIds: (detail.roleIds ?? []).map(Number),
        remark: detail.user?.remark ?? '',
      })
    }
    if (!isEdit) {
      form.reset({
        userName: '',
        nickName: '',
        deptId: undefined,
        phonenumber: '',
        email: '',
        sex: '2',
        status: '0',
        password: '',
        roleIds: [],
        remark: '',
      })
    }
  }, [isEdit, detail, form])

  const { mutate, isPending } = useMutation({
    mutationFn: (values: UserForm) => {
      const payload = {
        userId: currentRow?.userId,
        userName: values.userName,
        nickName: values.nickName,
        deptId: values.deptId ? Number(values.deptId) : undefined,
        phonenumber: values.phonenumber || undefined,
        email: values.email || undefined,
        sex: values.sex,
        status: values.status,
        password: values.password || undefined,
        remark: values.remark || undefined,
        roleIds: values.roleIds,
      }
      return isEdit ? updateUser(payload) : addUser(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? '修改成功' : '新增成功')
      queryClient.invalidateQueries({ queryKey: ['system-user-list'] })
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
          <DialogTitle>{isEdit ? '编辑用户' : '新增用户'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改用户信息后保存。' : '填写用户信息后保存。'}
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[70vh] overflow-y-auto py-1 pe-1'>
          <Form {...form}>
            <form
              id='user-form'
              onSubmit={form.handleSubmit((v) => mutate(v))}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='userName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      用户名
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入用户名'
                        className='col-span-4'
                        autoComplete='off'
                        disabled={isEdit}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='nickName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>昵称</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入昵称'
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
                name='deptId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>部门</FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='请选择部门'
                      className='col-span-4'
                      items={flattenTree(deptOptions).map((d) => ({
                        label: d.label,
                        value: String(d.id),
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='phonenumber'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      手机号
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入手机号'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>邮箱</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入邮箱'
                        className='col-span-4'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='sex'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>性别</FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      className='col-span-4'
                      items={[
                        { label: '男', value: '0' },
                        { label: '女', value: '1' },
                        { label: '未知', value: '2' },
                      ]}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='status'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>状态</FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      className='col-span-4'
                      items={[
                        { label: '正常', value: '0' },
                        { label: '停用', value: '1' },
                      ]}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              {!isEdit && (
                <FormField
                  control={form.control}
                  name='password'
                  render={({ field }) => (
                    <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                      <FormLabel className='col-span-2 text-end'>
                        密码
                      </FormLabel>
                      <FormControl>
                        <PasswordInput
                          placeholder='请输入密码'
                          className='col-span-4'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
              )}
              <FormField
                control={form.control}
                name='roleIds'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 pt-2 text-end'>
                      角色
                    </FormLabel>
                    <div className='col-span-4 rounded-md border'>
                      <ScrollArea className='h-32 p-2'>
                        <div className='space-y-2'>
                          {roles.map((role) => {
                            const checked = field.value.includes(role.roleId)
                            return (
                              <label
                                key={role.roleId}
                                className='flex items-center gap-2 text-sm'
                              >
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(value) => {
                                    field.onChange(
                                      value
                                        ? [...field.value, role.roleId]
                                        : field.value.filter(
                                            (id) => id !== role.roleId
                                          )
                                    )
                                  }}
                                />
                                {role.roleName}
                              </label>
                            )
                          })}
                        </div>
                      </ScrollArea>
                    </div>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='remark'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 pt-2 text-end'>
                      备注
                    </FormLabel>
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
          <Button type='submit' form='user-form' disabled={isPending}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
