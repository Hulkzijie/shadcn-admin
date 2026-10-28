'use client'

import { useMemo, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRouteNavigate } from '@/hooks/use-route-search'
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
import {
  buildInitialChecked,
  CheckboxTreePanel,
  normalizeTree,
} from '../../shared/checkbox-tree'
import { STATUS_OPTIONS } from '../../shared/constants'
import {
  addTenantPackage,
  getTenantPackage,
  getTenantPackageMenuTreeSelect,
  updateTenantPackage,
  type SysTenantPackageBo,
  type SysTenantPackageVo,
} from '../api'

const schema = z.object({
  packageName: z.string().min(1, '请输入套餐名称').max(100, '最多 100 个字符'),
  status: z.string().min(1, '请选择状态'),
  remark: z.string().optional(),
})

type TenantPackageFormValues = z.infer<typeof schema>

type TenantPackageFormProps = {
  packageId?: number | string
  detail?: SysTenantPackageVo
  menus: ReturnType<typeof normalizeTree>
  checkedKeys: (number | string)[]
  onSaved: () => void
}

function TenantPackageForm({
  packageId,
  detail,
  menus,
  checkedKeys,
  onSaved,
}: TenantPackageFormProps) {
  const isEdit = !!packageId
  const queryClient = useQueryClient()

  const strict = !!detail?.menuCheckStrictly
  const [menuLinked, setMenuLinked] = useState(!strict)
  const [menuChecked, setMenuChecked] = useState(() =>
    buildInitialChecked(menus, checkedKeys, strict)
  )

  const form = useForm<TenantPackageFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      packageName: detail?.packageName ?? '',
      status: detail?.status ?? '0',
      remark: detail?.remark ?? '',
    },
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (values: TenantPackageFormValues) => {
      const payload: SysTenantPackageBo = {
        packageId,
        packageName: values.packageName,
        status: values.status,
        remark: values.remark || undefined,
        menuIds: [...menuChecked],
        menuCheckStrictly: !menuLinked,
      }
      return isEdit ? updateTenantPackage(payload) : addTenantPackage(payload)
    },
    onSuccess: () => {
      toast.success(isEdit ? '修改成功' : '新增成功')
      queryClient.invalidateQueries({
        queryKey: ['system-tenant-package-list'],
      })
      queryClient.invalidateQueries({
        queryKey: ['system-tenant-package-options'],
      })
      onSaved()
    },
    onError: (error: Error) => toast.error(error.message || '保存失败'),
  })

  return (
    <>
      <div className='max-h-[70vh] overflow-y-auto py-1 pe-1'>
        <Form {...form}>
          <form
            id='tenant-package-form'
            onSubmit={form.handleSubmit((v) => mutate(v))}
            className='space-y-4 px-0.5'
          >
            <FormField
              control={form.control}
              name='packageName'
              render={({ field }) => (
                <FormItem className='grid grid-cols-6 items-center space-y-0 gap-x-4 gap-y-1'>
                  <FormLabel className='col-span-2 text-end'>
                    套餐名称
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder='请输入套餐名称'
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
                      rows={2}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage className='col-span-4 col-start-3' />
                </FormItem>
              )}
            />
            <div className='space-y-2'>
              <div className='text-sm font-medium'>菜单权限</div>
              <CheckboxTreePanel
                nodes={menus}
                checked={menuChecked}
                onCheckedChange={setMenuChecked}
                linked={menuLinked}
                onLinkedChange={setMenuLinked}
                heightClassName='h-72'
              />
            </div>
          </form>
        </Form>
      </div>
      <DialogFooter>
        <Button type='submit' form='tenant-package-form' disabled={isPending}>
          保存
        </Button>
      </DialogFooter>
    </>
  )
}

type TenantPackageMutateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow?: SysTenantPackageVo
}

export function TenantPackageMutateDialog({
  open,
  onOpenChange,
  currentRow,
}: TenantPackageMutateDialogProps) {
  const isEdit = !!currentRow
  const packageId = currentRow?.packageId
  const navigate = useRouteNavigate()

  const { data: detail } = useQuery({
    queryKey: ['system-tenant-package-detail', packageId],
    queryFn: () => getTenantPackage(packageId!),
    enabled: open && isEdit,
  })

  // 编辑时取套餐已勾选的菜单，新增时传 0 取全量菜单树
  const { data: menuTreeData } = useQuery({
    queryKey: ['system-tenant-package-menu-treeselect', packageId ?? 0],
    queryFn: () => getTenantPackageMenuTreeSelect(packageId ?? 0),
    enabled: open,
  })

  const menus = useMemo(
    () => normalizeTree(menuTreeData?.menus),
    [menuTreeData]
  )

  // 详情接口的 menuIds 为逗号分隔字符串，优先用它反选已勾选菜单
  const checkedKeys = useMemo(() => {
    if (detail?.menuIds) {
      return detail.menuIds
        .split(',')
        .map((id) => id.trim())
        .filter(Boolean)
    }
    return menuTreeData?.checkedKeys ?? []
  }, [detail, menuTreeData])

  const loading = !menuTreeData || (isEdit && !detail)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl'>
        <DialogHeader className='text-start'>
          <DialogTitle>{isEdit ? '编辑租户套餐' : '新增租户套餐'}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? '修改套餐信息与菜单权限后保存。'
              : '填写套餐信息并勾选可用的菜单权限。'}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className='flex h-40 items-center justify-center text-sm text-muted-foreground'>
            加载中...
          </div>
        ) : (
          <TenantPackageForm
            key={packageId ?? 'new'}
            packageId={packageId}
            detail={detail}
            menus={menus}
            checkedKeys={checkedKeys}
            onSaved={() => {
              // 新增后回到第一页，列表会按 pageNum=1&pageSize=10 重新请求
              if (!isEdit) {
                navigate({ search: (prev) => ({ ...prev, page: undefined }) })
              }
              onOpenChange(false)
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  )
}
