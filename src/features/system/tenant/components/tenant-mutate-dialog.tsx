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
import { Textarea } from '@/components/ui/textarea'
import { PasswordInput } from '@/components/password-input'
import { SelectDropdown } from '@/components/select-dropdown'
import { STATUS_OPTIONS } from '../../shared/constants'
import {
  addTenant,
  getTenant,
  tenantPackageOptions,
  updateTenant,
  type SysTenantBo,
  type SysTenantVo,
} from '../api'

const makeSchema = (isEdit: boolean) =>
  z.object({
    companyName: z
      .string()
      .min(1, '请输入企业名称')
      .max(100, '最多 100 个字符'),
    contactUserName: z.string().min(1, '请输入联系人'),
    contactPhone: z.string().min(1, '请输入联系电话'),
    username: z
      .string()
      .optional()
      .refine((v) => isEdit || (v != null && v.length > 0), {
        message: '请输入用户名',
      }),
    password: z
      .string()
      .optional()
      .refine((v) => isEdit || (v != null && v.length >= 6), {
        message: '密码长度至少 6 位',
      }),
    packageId: z.string().min(1, '请选择租户套餐'),
    accountCount: z.number().optional(),
    expireTime: z.string().optional(),
    status: z.string().min(1, '请选择状态'),
    licenseNumber: z.string().optional(),
    address: z.string().optional(),
    domain: z.string().optional(),
    intro: z.string().optional(),
    remark: z.string().optional(),
  })

type TenantForm = z.infer<ReturnType<typeof makeSchema>>

type TenantMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: SysTenantVo
}

export function TenantMutateDialog({
  open,
  onOpenChange,
  currentRow,
}: TenantMutateDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  const form = useForm<TenantForm>({
    resolver: zodResolver(makeSchema(isEdit)),
    defaultValues: {
      companyName: '',
      contactUserName: '',
      contactPhone: '',
      username: '',
      password: '',
      packageId: '',
      accountCount: -1,
      expireTime: '',
      status: '0',
      licenseNumber: '',
      address: '',
      domain: '',
      intro: '',
      remark: '',
    },
  })

  const { data: packageOptions } = useQuery({
    queryKey: ['system-tenant-package-options'],
    queryFn: tenantPackageOptions,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  const { data: detail } = useQuery({
    queryKey: ['system-tenant-detail', currentRow?.id],
    queryFn: () => getTenant(currentRow!.id),
    enabled: open && isEdit,
  })

  useEffect(() => {
    if (isEdit && detail) {
      form.reset({
        companyName: detail.companyName ?? '',
        contactUserName: detail.contactUserName ?? '',
        contactPhone: detail.contactPhone ?? '',
        username: '',
        password: '',
        packageId:
          detail.packageId !== undefined ? String(detail.packageId) : '',
        accountCount: detail.accountCount ?? -1,
        expireTime: detail.expireTime ?? '',
        status: detail.status ?? '0',
        licenseNumber: detail.licenseNumber ?? '',
        address: detail.address ?? '',
        domain: detail.domain ?? '',
        intro: detail.intro ?? '',
        remark: detail.remark ?? '',
      })
    }
    if (!isEdit) {
      form.reset({
        companyName: '',
        contactUserName: '',
        contactPhone: '',
        username: '',
        password: '',
        packageId: '',
        accountCount: -1,
        expireTime: '',
        status: '0',
        licenseNumber: '',
        address: '',
        domain: '',
        intro: '',
        remark: '',
      })
    }
  }, [isEdit, detail, form])

  const { mutate, isPending } = useMutation({
    mutationFn: (values: TenantForm) => {
      const payload: SysTenantBo = {
        id: currentRow?.id,
        companyName: values.companyName,
        contactUserName: values.contactUserName,
        contactPhone: values.contactPhone,
        username: values.username || undefined,
        password: values.password || undefined,
        packageId: Number(values.packageId),
        accountCount: values.accountCount,
        expireTime: values.expireTime || undefined,
        status: values.status,
        licenseNumber: values.licenseNumber || undefined,
        address: values.address || undefined,
        domain: values.domain || undefined,
        intro: values.intro || undefined,
        remark: values.remark || undefined,
      }
      return isEdit ? updateTenant(payload) : addTenant(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? '修改成功' : '新增成功')
      queryClient.invalidateQueries({ queryKey: ['system-tenant-list'] })
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
          <DialogTitle>{isEdit ? '编辑租户' : '新增租户'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改租户信息后保存。' : '填写租户信息后保存。'}
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[70vh] overflow-y-auto py-1 pe-1'>
          <Form {...form}>
            <form
              id='tenant-form'
              onSubmit={form.handleSubmit((v) => mutate(v))}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='companyName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      企业名称
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入企业名称'
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
                name='contactUserName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      联系人
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入联系人'
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
                name='contactPhone'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      联系电话
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入联系电话'
                        className='col-span-4'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              {!isEdit && (
                <FormField
                  control={form.control}
                  name='username'
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
                          {...field}
                        />
                      </FormControl>
                      <FormMessage className='col-span-4 col-start-3' />
                    </FormItem>
                  )}
                />
              )}
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
                          autoComplete='new-password'
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
                name='packageId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      租户套餐
                    </FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='请选择租户套餐'
                      className='col-span-4'
                      items={(packageOptions ?? []).map((p) => ({
                        label: p.packageName,
                        value: String(p.packageId),
                      }))}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='accountCount'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      用户数量
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='请输入用户数量，-1 表示不限'
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
                name='expireTime'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      过期时间
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='datetime-local'
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
                name='status'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
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
                name='licenseNumber'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      信用代码
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入统一社会信用代码'
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
                name='address'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>地址</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入地址'
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
                name='domain'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>域名</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入域名'
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
                name='intro'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-start space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 pt-2 text-end'>
                      企业简介
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder='请输入企业简介'
                        className='col-span-4 resize-none'
                        rows={3}
                        {...field}
                      />
                    </FormControl>
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
          <Button type='submit' form='tenant-form' disabled={isPending}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
