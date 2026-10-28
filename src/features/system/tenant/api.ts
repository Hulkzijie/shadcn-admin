import { sysList, sysRequest, type PageQuery } from '../shared/api'

export interface SysTenantVo {
  id: number
  tenantId: string
  contactUserName: string
  contactPhone: string
  companyName: string
  licenseNumber?: string
  address?: string
  domain?: string
  intro?: string
  remark?: string
  packageId?: number
  expireTime?: string
  accountCount?: number
  status: string
}

export interface SysTenantQuery extends PageQuery {
  companyName?: string
  contactUserName?: string
  status?: string
}

export interface SysTenantBo {
  id?: number
  tenantId?: string
  contactUserName: string
  contactPhone: string
  companyName: string
  username?: string
  password?: string
  licenseNumber?: string
  address?: string
  domain?: string
  intro?: string
  remark?: string
  packageId: number
  expireTime?: string
  accountCount?: number
  status?: string
}

export interface SysTenantPackageVo {
  packageId: number
  packageName: string
  menuIds?: string
  remark?: string
  menuCheckStrictly?: boolean
  status?: string
}

/** GET /system/tenant/list 分页查询租户 */
export function listTenants(params: SysTenantQuery) {
  return sysList<SysTenantVo>({
    url: '/system/tenant/list',
    method: 'get',
    params,
  })
}

/** GET /system/tenant/{id} 租户详情 */
export function getTenant(id: number) {
  return sysRequest<SysTenantVo>({ url: `/system/tenant/${id}`, method: 'get' })
}

/** POST /system/tenant 新增租户（后端 @ApiEncrypt，需加密请求体） */
export function addTenant(data: SysTenantBo) {
  return sysRequest<void>({
    url: '/system/tenant',
    method: 'post',
    data,
    encrypt: true,
  })
}

/** PUT /system/tenant 修改租户 */
export function updateTenant(data: SysTenantBo) {
  return sysRequest<void>({ url: '/system/tenant', method: 'put', data })
}

/** PUT /system/tenant/changeStatus 修改租户状态 */
export function changeTenantStatus(tenantId: string, status: string) {
  return sysRequest<void>({
    url: '/system/tenant/changeStatus',
    method: 'put',
    data: { tenantId, status },
  })
}

/** DELETE /system/tenant/{ids} 删除租户（逗号分隔） */
export function deleteTenants(ids: (number | string)[]) {
  return sysRequest<void>({
    url: `/system/tenant/${ids.join(',')}`,
    method: 'delete',
  })
}

/** GET /system/tenant/package/selectList 租户套餐下拉列表 */
export function tenantPackageOptions() {
  return sysRequest<SysTenantPackageVo[]>({
    url: '/system/tenant/package/selectList',
    method: 'get',
  })
}
