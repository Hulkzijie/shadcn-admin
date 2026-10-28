'use client'

import { useMemo, useState } from 'react'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  buildInitialChecked,
  CheckboxTreePanel,
  normalizeTree,
  type CheckboxTreeNode,
} from '../../shared/checkbox-tree'
import {
  getRole,
  getRoleDeptTreeSelect,
  getRoleMenuTreeSelect,
  updateRole,
  updateRoleDataScope,
  type SysRoleVo,
} from '../api'

const DATA_SCOPE_OPTIONS = [
  { label: '全部数据权限', value: '1' },
  { label: '自定义数据权限', value: '2' },
  { label: '本部门数据权限', value: '3' },
  { label: '本部门及以下数据权限', value: '4' },
  { label: '仅本人数据权限', value: '5' },
]

type RolePermissionFormProps = {
  roleId: number
  roleName: string
  detail: SysRoleVo
  menus: CheckboxTreeNode[]
  menuCheckedKeys?: (number | string)[]
  depts: CheckboxTreeNode[]
  deptCheckedKeys?: (number | string)[]
  onSaved: () => void
}

function RolePermissionForm({
  roleId,
  roleName,
  detail,
  menus,
  menuCheckedKeys,
  depts,
  deptCheckedKeys,
  onSaved,
}: RolePermissionFormProps) {
  const queryClient = useQueryClient()

  const [menuLinked, setMenuLinked] = useState(!detail.menuCheckStrictly)
  const [menuChecked, setMenuChecked] = useState(() =>
    buildInitialChecked(menus, menuCheckedKeys, !!detail.menuCheckStrictly)
  )

  const [dataScope, setDataScope] = useState(detail.dataScope || '1')
  const [deptLinked, setDeptLinked] = useState(!detail.deptCheckStrictly)
  const [deptChecked, setDeptChecked] = useState(() =>
    buildInitialChecked(depts, deptCheckedKeys, !!detail.deptCheckStrictly)
  )

  const { mutate, isPending } = useMutation({
    mutationFn: async () => {
      await updateRole({
        roleId,
        roleName: detail.roleName,
        roleKey: detail.roleKey,
        roleSort: detail.roleSort,
        dataScope: detail.dataScope,
        status: detail.status,
        remark: detail.remark,
        menuCheckStrictly: !menuLinked,
        deptCheckStrictly: !deptLinked,
        menuIds: [...menuChecked],
      })
      await updateRoleDataScope({
        roleId,
        dataScope,
        deptCheckStrictly: !deptLinked,
        deptIds: dataScope === '2' ? [...deptChecked] : undefined,
      })
    },
    onSuccess: () => {
      toast.success('分配权限成功')
      queryClient.invalidateQueries({ queryKey: ['system-role-list'] })
      queryClient.invalidateQueries({ queryKey: ['system-role-detail'] })
      queryClient.invalidateQueries({
        queryKey: ['system-role-menu-treeselect'],
      })
      queryClient.invalidateQueries({
        queryKey: ['system-role-dept-treeselect'],
      })
      onSaved()
    },
    onError: (error: Error) => toast.error(error.message || '保存失败'),
  })

  return (
    <>
      <DialogHeader className='text-start'>
        <DialogTitle>分配权限</DialogTitle>
        <DialogDescription>
          为角色 <span className='font-bold'>{roleName}</span>{' '}
          配置菜单权限与数据权限。
        </DialogDescription>
      </DialogHeader>

      <Tabs defaultValue='menu' className='gap-4'>
        <TabsList>
          <TabsTrigger value='menu'>菜单权限</TabsTrigger>
          <TabsTrigger value='data'>数据权限</TabsTrigger>
        </TabsList>

        <TabsContent value='menu'>
          <CheckboxTreePanel
            nodes={menus}
            checked={menuChecked}
            onCheckedChange={setMenuChecked}
            linked={menuLinked}
            onLinkedChange={setMenuLinked}
          />
        </TabsContent>

        <TabsContent value='data' className='space-y-4'>
          <div className='flex items-center gap-3'>
            <span className='text-sm'>数据范围</span>
            <Select value={dataScope} onValueChange={setDataScope}>
              <SelectTrigger className='w-52'>
                <SelectValue placeholder='请选择数据范围' />
              </SelectTrigger>
              <SelectContent>
                {DATA_SCOPE_OPTIONS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {dataScope === '2' && (
            <CheckboxTreePanel
              nodes={depts}
              checked={deptChecked}
              onCheckedChange={setDeptChecked}
              linked={deptLinked}
              onLinkedChange={setDeptLinked}
            />
          )}
        </TabsContent>
      </Tabs>

      <DialogFooter>
        <Button variant='outline' onClick={onSaved}>
          取消
        </Button>
        <Button disabled={isPending} onClick={() => mutate()}>
          保存
        </Button>
      </DialogFooter>
    </>
  )
}

type RolePermissionDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentRow: SysRoleVo
}

export function RolePermissionDialog({
  open,
  onOpenChange,
  currentRow,
}: RolePermissionDialogProps) {
  const roleId = Number(currentRow.roleId)

  const { data: detail } = useQuery({
    queryKey: ['system-role-detail', roleId],
    queryFn: () => getRole(roleId),
    enabled: open,
  })

  const { data: menuTreeSelect } = useQuery({
    queryKey: ['system-role-menu-treeselect', roleId],
    queryFn: () => getRoleMenuTreeSelect(roleId),
    enabled: open,
  })

  const { data: deptTreeSelect } = useQuery({
    queryKey: ['system-role-dept-treeselect', roleId],
    queryFn: () => getRoleDeptTreeSelect(roleId),
    enabled: open,
  })

  const menus = useMemo(
    () => normalizeTree(menuTreeSelect?.menus),
    [menuTreeSelect]
  )
  const depts = useMemo(
    () => normalizeTree(deptTreeSelect?.depts),
    [deptTreeSelect]
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-2xl'>
        {detail && menuTreeSelect && deptTreeSelect ? (
          <RolePermissionForm
            key={roleId}
            roleId={roleId}
            roleName={currentRow.roleName}
            detail={detail}
            menus={menus}
            menuCheckedKeys={menuTreeSelect.checkedKeys}
            depts={depts}
            deptCheckedKeys={deptTreeSelect.checkedKeys}
            onSaved={() => onOpenChange(false)}
          />
        ) : (
          <>
            <DialogHeader className='text-start'>
              <DialogTitle>分配权限</DialogTitle>
              <DialogDescription>
                为角色 <span className='font-bold'>{currentRow.roleName}</span>{' '}
                配置菜单权限与数据权限。
              </DialogDescription>
            </DialogHeader>
            <div className='flex h-40 items-center justify-center text-sm text-muted-foreground'>
              加载中...
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
