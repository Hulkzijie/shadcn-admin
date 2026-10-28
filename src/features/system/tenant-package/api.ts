import {
  sysList,
  sysRequest,
  type PageQuery,
  type TreeNode,
} from '../shared/api'

export interface SysTenantPackageVo {
  packageId: number | string
  packageName: string
  menuIds?: string
  remark?: string
  menuCheckStrictly?: boolean
  status?: string
}

export interface SysTenantPackageQuery extends PageQuery {
  packageName?: string
  status?: string
}

export interface SysTenantPackageBo {
  packageId?: number | string
  packageName: string
  menuIds?: (number | string)[]
  remark?: string
  menuCheckStrictly?: boolean
  status?: string
}

/** GET /system/tenant/package/list 分页查询租户套餐 */
export function listTenantPackages(params: SysTenantPackageQuery) {
  return sysList<SysTenantPackageVo>({
    url: '/system/tenant/package/list',
    method: 'get',
    params,
  })
}

/** GET /system/tenant/package/{packageId} 租户套餐详情 */
export function getTenantPackage(packageId: number | string) {
  return sysRequest<SysTenantPackageVo>({
    url: `/system/tenant/package/${packageId}`,
    method: 'get',
  })
}

/** POST /system/tenant/package 新增租户套餐 */
export function addTenantPackage(data: SysTenantPackageBo) {
  return sysRequest<void>({
    url: '/system/tenant/package',
    method: 'post',
    data,
  })
}

/** PUT /system/tenant/package 修改租户套餐 */
export function updateTenantPackage(data: SysTenantPackageBo) {
  return sysRequest<void>({
    url: '/system/tenant/package',
    method: 'put',
    data,
  })
}

/** PUT /system/tenant/package/changeStatus 修改租户套餐状态 */
export function changeTenantPackageStatus(
  packageId: number | string,
  status: string
) {
  return sysRequest<void>({
    url: '/system/tenant/package/changeStatus',
    method: 'put',
    data: { packageId, status },
  })
}

/** DELETE /system/tenant/package/{packageIds} 删除租户套餐（逗号分隔） */
export function deleteTenantPackages(packageIds: (number | string)[]) {
  return sysRequest<void>({
    url: `/system/tenant/package/${packageIds.join(',')}`,
    method: 'delete',
  })
}

/** 租户套餐菜单树选择结果 */
export interface SysTenantPackageMenuTreeSelect {
  menus: TreeNode[]
  checkedKeys: (number | string)[]
}

/** GET /system/menu/tenantPackageMenuTreeselect/{packageId} 租户套餐菜单树 */
export function getTenantPackageMenuTreeSelect(packageId: number | string) {
  return sysRequest<SysTenantPackageMenuTreeSelect>({
    url: `/system/menu/tenantPackageMenuTreeselect/${packageId}`,
    method: 'get',
  })
}
