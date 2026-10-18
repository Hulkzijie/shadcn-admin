import { type AxiosRequestConfig } from 'axios'
import { javaClient } from '@/lib/api/java-client'

/** RuoYi-Vue-Plus 统一响应结构 */
export interface RuoYiResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

/** 分页响应结构 */
export interface TableDataInfo<T> {
  total: number
  rows: T[]
  code: number
  msg: string
}

/** 分页查询基类 */
export interface PageQuery {
  pageNum?: number
  pageSize?: number
  orderByColumn?: string
  isAsc?: string
}

/** 树形选择节点（后端 hutool Tree 序列化结构） */
export interface TreeNode {
  id: number
  parentId: number
  label: string
  weight?: number
  children?: TreeNode[]
}

/**
 * 请求返回 R<T> 的接口，成功时返回 data；业务错误（code !== 200）抛出异常。
 */
export async function sysRequest<T>(config: AxiosRequestConfig): Promise<T> {
  const res = await javaClient.request<RuoYiResponse<T>>(config)
  const body = res.data
  if (
    body &&
    typeof body === 'object' &&
    typeof body.code === 'number' &&
    body.code !== 200
  ) {
    throw new Error(body.msg || `请求失败（${body.code}）`)
  }
  return body?.data
}

/**
 * 请求返回 TableDataInfo<T> 的分页接口，返回 { total, rows }。
 */
export async function sysList<T>(
  config: AxiosRequestConfig
): Promise<{ total: number; rows: T[] }> {
  const res = await javaClient.request<TableDataInfo<T>>(config)
  const body = res.data
  if (body && typeof body.code === 'number' && body.code !== 200) {
    throw new Error(body.msg || `请求失败（${body.code}）`)
  }
  return {
    total: Number(body?.total ?? 0),
    rows: Array.isArray(body?.rows) ? body.rows : [],
  }
}

/** 把扁平的树节点数组拍平成可选列表（保留层级缩进） */
export function flattenTree(
  nodes: TreeNode[] | undefined,
  depth = 0
): { id: number; label: string }[] {
  if (!nodes?.length) return []
  return nodes.flatMap((node) => [
    { id: node.id, label: `${'　'.repeat(depth)}${node.label}` },
    ...flattenTree(node.children, depth + 1),
  ])
}
