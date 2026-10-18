import { sysRequest } from '../shared/api'

export interface SysDeptVo {
  deptId: number
  parentId: number
  parentName?: string
  ancestors?: string
  deptName: string
  deptCategory?: string
  orderNum: number
  leader?: number
  leaderName?: string
  phone?: string
  email?: string
  status: string
  createTime?: string
  children?: SysDeptVo[]
}

export interface SysDeptQuery {
  deptName?: string
  status?: string
}

export interface SysDeptBo {
  deptId?: number
  parentId?: number
  deptName: string
  deptCategory?: string
  orderNum: number
  leader?: number
  phone?: string
  email?: string
  status?: string
}

/** 扁平化后的部门行，附带层级深度用于缩进渲染 */
export type FlatDept = SysDeptVo & { _depth: number }

export function flattenDepts(
  nodes: SysDeptVo[] | undefined,
  depth = 0
): FlatDept[] {
  if (!nodes?.length) return []
  return nodes.flatMap((n) => [
    { ...n, _depth: depth },
    ...flattenDepts(n.children, depth + 1),
  ])
}

export function listDepts(params: SysDeptQuery) {
  return sysRequest<SysDeptVo[]>({
    url: '/system/dept/list',
    method: 'get',
    params,
  })
}

export function getDept(deptId: number) {
  return sysRequest<SysDeptVo>({
    url: `/system/dept/${deptId}`,
    method: 'get',
  })
}

export function addDept(data: SysDeptBo) {
  return sysRequest<void>({ url: '/system/dept', method: 'post', data })
}

export function updateDept(data: SysDeptBo) {
  return sysRequest<void>({ url: '/system/dept', method: 'put', data })
}

export function deleteDept(deptId: number) {
  return sysRequest<void>({
    url: `/system/dept/${deptId}`,
    method: 'delete',
  })
}
