import {
  sysList,
  sysRequest,
  type PageQuery,
  type TreeNode,
} from '../shared/api'

export interface SysRoleOption {
  roleId: number
  roleName: string
  roleKey: string
}

export interface SysUserVo {
  userId: number
  tenantId?: string
  deptId?: number
  userName: string
  nickName: string
  userType?: string
  email?: string
  phonenumber?: string
  sex?: string
  avatar?: string
  status: string
  loginIp?: string
  loginDate?: string
  remark?: string
  createTime?: string
  deptName?: string
  roles?: SysRoleOption[]
  roleIds?: number[]
  postIds?: number[]
  roleId?: number
}

/** GET /system/user/{userId} 返回的用户详情 */
export interface SysUserInfoVo {
  user: SysUserVo
  roleIds?: number[]
  postIds?: number[]
  roles?: SysRoleOption[]
}

export interface SysUserQuery extends PageQuery {
  userName?: string
  phonenumber?: string
  status?: string
  deptId?: number
}

export interface SysUserBo {
  userId?: number
  deptId?: number
  userName?: string
  nickName?: string
  email?: string
  phonenumber?: string
  sex?: string
  password?: string
  status?: string
  remark?: string
  roleIds?: number[]
  postIds?: number[]
}

export function listUsers(params: SysUserQuery) {
  return sysList<SysUserVo>({ url: '/system/user/list', method: 'get', params })
}

export function getUserInfo(userId: number) {
  return sysRequest<SysUserInfoVo>({
    url: `/system/user/${userId}`,
    method: 'get',
  })
}

export function addUser(data: SysUserBo) {
  return sysRequest<void>({ url: '/system/user', method: 'post', data })
}

export function updateUser(data: SysUserBo) {
  return sysRequest<void>({ url: '/system/user', method: 'put', data })
}

export function deleteUsers(userIds: (number | string)[]) {
  return sysRequest<void>({
    url: `/system/user/${userIds.join(',')}`,
    method: 'delete',
  })
}

export function changeUserStatus(userId: number, status: string) {
  return sysRequest<void>({
    url: '/system/user/changeStatus',
    method: 'put',
    data: { userId, status },
  })
}

/** 重置密码（后端 @ApiEncrypt，需加密请求体） */
export function resetUserPwd(userId: number, password: string) {
  return sysRequest<void>({
    url: '/system/user/resetPwd',
    method: 'put',
    data: { userId, password },
    encrypt: true,
  })
}

export function deptTree() {
  return sysRequest<TreeNode[]>({
    url: '/system/user/deptTree',
    method: 'get',
  })
}

export function roleOptions() {
  return sysRequest<SysRoleOption[]>({
    url: '/system/role/optionselect',
    method: 'get',
  })
}
