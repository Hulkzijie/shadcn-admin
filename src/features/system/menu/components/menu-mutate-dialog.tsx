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
import { SelectDropdown } from '@/components/select-dropdown'
import { flattenTree } from '../../shared/api'
import {
  addMenu,
  getMenu,
  menuTreeSelect,
  updateMenu,
  type SysMenuBo,
  type SysMenuVo,
} from '../api'

const menuSchema = z.object({
  parentId: z.string().optional(),
  menuName: z.string().min(1, '请输入菜单名称').max(50, '最多 50 个字符'),
  orderNum: z.number({ error: '请输入显示排序' }),
  menuType: z.string().min(1, '请选择菜单类型'),
  path: z.string().optional(),
  component: z.string().optional(),
  perms: z.string().optional(),
  icon: z.string().optional(),
  visible: z.string().optional(),
  status: z.string().optional(),
  isFrame: z.string().optional(),
  isCache: z.string().optional(),
  remark: z.string().optional(),
})

type MenuForm = z.infer<typeof menuSchema>

const DEFAULT_VALUES: MenuForm = {
  parentId: '0',
  menuName: '',
  orderNum: 0,
  menuType: 'C',
  path: '',
  component: '',
  perms: '',
  icon: '',
  visible: '0',
  status: '0',
  isFrame: '1',
  isCache: '0',
  remark: '',
}

type MenuMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: SysMenuVo
}

export function MenuMutateDialog({
  open,
  onOpenChange,
  currentRow,
}: MenuMutateDialogProps) {
  const isEdit = !!currentRow
  const queryClient = useQueryClient()

  const form = useForm<MenuForm>({
    resolver: zodResolver(menuSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const { data: treeOptions } = useQuery({
    queryKey: ['system-menu-treeselect'],
    queryFn: menuTreeSelect,
    enabled: open,
    staleTime: 5 * 60 * 1000,
  })

  const { data: detail } = useQuery({
    queryKey: ['system-menu-detail', currentRow?.menuId],
    queryFn: () => getMenu(currentRow!.menuId),
    enabled: open && isEdit,
  })

  const parentOptions = [
    { label: '根目录', value: '0' },
    ...flattenTree(treeOptions).map((node) => ({
      label: node.label,
      value: String(node.id),
    })),
  ]

  useEffect(() => {
    if (isEdit && detail) {
      form.reset({
        parentId: String(detail.parentId),
        menuName: detail.menuName ?? '',
        orderNum: detail.orderNum ?? 0,
        menuType: detail.menuType ?? 'C',
        path: detail.path ?? '',
        component: detail.component ?? '',
        perms: detail.perms ?? '',
        icon: detail.icon ?? '',
        visible: detail.visible ?? '0',
        status: detail.status ?? '0',
        isFrame: detail.isFrame ?? '1',
        isCache: detail.isCache ?? '0',
        remark: detail.remark ?? '',
      })
    }
    if (!isEdit) {
      form.reset({ ...DEFAULT_VALUES })
    }
  }, [isEdit, detail, form])

  const { mutate, isPending } = useMutation({
    mutationFn: (values: MenuForm) => {
      const payload: SysMenuBo = {
        menuId: currentRow?.menuId,
        parentId: values.parentId ? Number(values.parentId) : 0,
        menuName: values.menuName,
        orderNum: values.orderNum,
        menuType: values.menuType,
        path: values.path || undefined,
        component: values.component || undefined,
        perms: values.perms || undefined,
        icon: values.icon || undefined,
        visible: values.visible || undefined,
        status: values.status || undefined,
        isFrame: values.isFrame || undefined,
        isCache: values.isCache || undefined,
        remark: values.remark || undefined,
      }
      return isEdit ? updateMenu(payload) : addMenu(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? '修改成功' : '新增成功')
      queryClient.invalidateQueries({ queryKey: ['system-menu-list'] })
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
          <DialogTitle>{isEdit ? '编辑菜单' : '新增菜单'}</DialogTitle>
          <DialogDescription>
            {isEdit ? '修改菜单信息后保存。' : '填写菜单信息后保存。'}
          </DialogDescription>
        </DialogHeader>
        <div className='max-h-[70vh] overflow-y-auto py-1 pe-1'>
          <Form {...form}>
            <form
              id='menu-form'
              onSubmit={form.handleSubmit((v) => mutate(v))}
              className='space-y-4 px-0.5'
            >
              <FormField
                control={form.control}
                name='parentId'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      上级菜单
                    </FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='请选择上级菜单'
                      className='col-span-4'
                      items={parentOptions}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='menuName'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      菜单名称
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入菜单名称'
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
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      显示排序
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        placeholder='请输入显示排序'
                        className='col-span-4'
                        {...field}
                        value={Number.isNaN(field.value) ? '' : field.value}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                      />
                    </FormControl>
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='menuType'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      菜单类型
                    </FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      placeholder='请选择菜单类型'
                      className='col-span-4'
                      items={[
                        { label: '目录', value: 'M' },
                        { label: '菜单', value: 'C' },
                        { label: '按钮', value: 'F' },
                      ]}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='icon'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      菜单图标
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入菜单图标'
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
                name='path'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      路由地址
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入路由地址'
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
                name='component'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      组件路径
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入组件路径'
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
                name='perms'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      权限标识
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder='请输入权限标识'
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
                name='visible'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      显示状态
                    </FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      className='col-span-4'
                      items={[
                        { label: '显示', value: '0' },
                        { label: '隐藏', value: '1' },
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
                    <FormLabel className='col-span-2 text-end'>
                      菜单状态
                    </FormLabel>
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
              <FormField
                control={form.control}
                name='isFrame'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      是否外链
                    </FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      className='col-span-4'
                      items={[
                        { label: '是', value: '0' },
                        { label: '否', value: '1' },
                      ]}
                    />
                    <FormMessage className='col-span-4 col-start-3' />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='isCache'
                render={({ field }) => (
                  <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                    <FormLabel className='col-span-2 text-end'>
                      是否缓存
                    </FormLabel>
                    <SelectDropdown
                      isControlled
                      defaultValue={field.value}
                      onValueChange={field.onChange}
                      className='col-span-4'
                      items={[
                        { label: '缓存', value: '0' },
                        { label: '不缓存', value: '1' },
                      ]}
                    />
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
          <Button type='submit' form='menu-form' disabled={isPending}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
