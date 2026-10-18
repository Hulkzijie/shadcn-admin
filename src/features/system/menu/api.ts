import { sysRequest, type TreeNode } from '../shared/api'

export interface SysMenuVo {
  menuId: number
  menuName: string
  parentId: number
  orderNum: number
  path?: string
  component?: string
  queryParam?: string
  isFrame?: string
  isCache?: string
  menuType: string
  visible?: string
  status: string
  perms?: string
  icon?: string
  remark?: string
  createTime?: string
  children?: SysMenuVo[]
}

export interface SysMenuQuery {
  menuName?: string
  status?: string
}

export interface SysMenuBo {
  menuId?: number
  parentId?: number
  menuName: string
  orderNum: number
  path?: string
  component?: string
  queryParam?: string
  isFrame?: string
  isCache?: string
  menuType: string
  visible?: string
  status?: string
  perms?: string
  icon?: string
  remark?: string
}

/** GET /system/menu/list，返回树形结构（无分页） */
export function listMenus(params: SysMenuQuery) {
  return sysRequest<SysMenuVo[]>({
    url: '/system/menu/list',
    method: 'get',
    params,
  })
}

/** GET /system/menu/{menuId} */
export function getMenu(menuId: number) {
  return sysRequest<SysMenuVo>({
    url: `/system/menu/${menuId}`,
    method: 'get',
  })
}

export function addMenu(data: SysMenuBo) {
  return sysRequest<void>({ url: '/system/menu', method: 'post', data })
}

export function updateMenu(data: SysMenuBo) {
  return sysRequest<void>({ url: '/system/menu', method: 'put', data })
}

export function deleteMenu(menuId: number) {
  return sysRequest<void>({
    url: `/system/menu/${menuId}`,
    method: 'delete',
  })
}

/** GET /system/menu/treeselect，返回树形选择节点 */
export function menuTreeSelect() {
  return sysRequest<TreeNode[]>({
    url: '/system/menu/treeselect',
    method: 'get',
  })
}
