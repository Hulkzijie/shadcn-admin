import { sysList, sysRequest, type PageQuery } from '../shared/api'

export interface SysRoleVo {
  roleId: number
  roleName: string
  roleKey: string
  roleSort: number
  dataScope?: string
  menuCheckStrictly?: boolean
  deptCheckStrictly?: boolean
  status: string
  remark?: string
  createTime?: string
  flag?: boolean
}

export interface SysRoleQuery extends PageQuery {
  roleName?: string
  roleKey?: string
  status?: string
}

export interface SysRoleBo {
  roleId?: number
  roleName: string
  roleKey: string
  roleSort: number
  dataScope?: string
  menuCheckStrictly?: boolean
  deptCheckStrictly?: boolean
  status?: string
  remark?: string
  menuIds?: number[]
  deptIds?: number[]
}

/** GET /system/role/list 分页查询角色 */
export function listRoles(params: SysRoleQuery) {
  return sysList<SysRoleVo>({ url: '/system/role/list', method: 'get', params })
}

/** GET /system/role/{roleId} 角色详情 */
export function getRole(roleId: number) {
  return sysRequest<SysRoleVo>({ url: `/system/role/${roleId}`, method: 'get' })
}

/** POST /system/role 新增角色 */
export function addRole(data: SysRoleBo) {
  return sysRequest<void>({ url: '/system/role', method: 'post', data })
}

/** PUT /system/role 修改角色 */
export function updateRole(data: SysRoleBo) {
  return sysRequest<void>({ url: '/system/role', method: 'put', data })
}

/** PUT /system/role/changeStatus 修改角色状态 */
export function changeRoleStatus(roleId: number, status: string) {
  return sysRequest<void>({
    url: '/system/role/changeStatus',
    method: 'put',
    data: { roleId, status },
  })
}

/** DELETE /system/role/{roleIds} 删除角色（逗号分隔） */
export function deleteRoles(roleIds: (number | string)[]) {
  return sysRequest<void>({
    url: `/system/role/${roleIds.join(',')}`,
    method: 'delete',
  })
}

/** GET /system/role/optionselect 角色下拉列表 */
export function roleOptionSelect() {
  return sysRequest<SysRoleVo[]>({
    url: '/system/role/optionselect',
    method: 'get',
  })
}
