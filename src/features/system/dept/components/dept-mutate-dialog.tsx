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
import { STATUS_OPTIONS } from '../../shared/constants'
import {
  addDept,
  flattenDepts,
  getDept,
  listDepts,
  updateDept,
  type SysDeptBo,
  type SysDeptVo,
} from '../api'

const deptSchema = z.object({
  deptName: z.string().min(1, '请输入部门名称').max(30, '最多 30 个字符'),
  parentId: z.string().optional(),
  orderNum: z
    .string()
    .min(1, '请输入排序')
    .regex(/^\d+$/, '排序必须为非负整数'),
  leader: z
    .string()
    .optional()
    .refine((v) => !v || /^\d+$/.test(v), '负责人必须为数字'),
  phone: z.string().optional(),
  email: z.union([z.literal(''), z.email('邮箱格式不正确')]).optional(),
  status: z.string().optional(),
  deptCategory: z.string().optional(),
})

type DeptForm = z.infer<typeof deptSchema>

const emptyValues: DeptForm = {
  deptName: '',
  parentId: '0',
  orderNum: '0',
  leader: '',
  phone: '',
  email: '',
  status: '0',
  deptCategory: '',
}

type DeptMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: SysDeptVo
}

export function DeptMutateDialog({
  open,
  onOpenChange,
  currentRow,
}: DeptMutateDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  const form = useForm<DeptForm>({
    resolver: zodResolver(deptSchema),
    defaultValues: emptyValues,
  })

  const { data: allDepts } = useQuery({
    queryKey: ['system-dept-list', {}],
    queryFn: () => listDepts({}),
    enabled: open,
  })

  const { data: detail } = useQuery({
    queryKey: ['system-dept-detail', currentRow?.deptId],
    queryFn: () => getDept(currentRow!.deptId),
    enabled: open && isEdit,
  })

  useEffect(() => {
    if (isEdit && detail) {
      form.reset({
        deptName: detail.deptName ?? '',
        parentId:
          detail.parentId !== undefined ? String(detail.parentId) : '0',
        orderNum: detail.orderNum !== undefined ? String(detail.orderNum) : '0',
        leader: detail.leader !== undefined ? String(detail.leader) : '',
        phone: detail.phone ?? '',
        email: detail.email ?? '',
        status: detail.status ?? '0',
        deptCategory: detail.deptCategory ?? '',
      })
    }
    if (!isEdit) {
      form.reset(emptyValues)
    }
  }, [isEdit, detail, form])

  const parentOptions = [
    { label: '根部门', value: '0' },
    ...flattenDepts(allDepts).map((d) => ({
      label: `${'　'.repeat(d._depth)}${d.deptName}`,
      value: String(d.deptId),
    })),
  ]

  const { mutate, isPending } = useMutation({
    mutationFn: (values: DeptForm) => {
      const payload: SysDeptBo = {
        deptId: currentRow?.deptId,
        parentId: values.parentId ? Number(values.parentId) : undefined,
        deptName: values.deptName,
        deptCategory: values.deptCategory || undefined,
        orderNum: Number(values.orderNum),
        leader: values.leader ? Number(values.leader) : undefined,
        phone: values.phone || undefined,
        email: values.email || undefined,
        status: values.status || undefined,
      }
      return isEdit ? updateDept(payload) : addDept(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? '修改成功' : '新增成功')
      queryClient.invalidateQueries({ queryKey: ['system-dept-list'] })
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
          <DialogTitle>{isEdit ? '编辑部门' : '新增部门'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改部门信息后保存。' : '填写部门信息后保存。'}
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[70vh] overflow-y-auto py-1 pe-1'>
          <Form {...form}>
            <form
              id='dept-form'
              onSubmit={form.handleSubmit((v) => mutate(v))}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='parentId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 text-end'>
                      上级部门
                    </FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='请选择上级部门'
                      className='col-span-4'
                      items={parentOptions}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='deptName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 text-end'>
                      部门名称
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入部门名称'
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
                name='orderNum'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 text-end'>排序</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='请输入排序'
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
                name='leader'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 text-end'>负责人</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入负责人用户 ID'
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
                name='phone'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 text-end'>
                      联系电话
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入联系电话'
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
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
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
                name='deptCategory'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center gap-x-4 gap-y-1 space-y-0'>
                    <FormLabel className='col-span-2 text-end'>
                      部门类别
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入部门类别'
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
            </form>
          </Form>
        </div>
        <DialogFooter>
          <Button type='submit' form='dept-form' disabled={isPending}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
