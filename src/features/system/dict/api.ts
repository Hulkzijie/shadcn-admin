import { sysList, sysRequest, type PageQuery } from '../shared/api'

export interface SysDictTypeVo {
  dictId: number
  dictName: string
  dictType: string
  remark?: string
  createTime?: string
}

export interface SysDictTypeQuery extends PageQuery {
  dictName?: string
  dictType?: string
}

export interface SysDictTypeBo {
  dictId?: number
  dictName: string
  dictType: string
  remark?: string
}

/** GET /system/dict/type/list 分页查询字典类型 */
export function listDictTypes(params: SysDictTypeQuery) {
  return sysList<SysDictTypeVo>({
    url: '/system/dict/type/list',
    method: 'get',
    params,
  })
}

/** GET /system/dict/type/{dictId} 字典类型详情 */
export function getDictType(dictId: number) {
  return sysRequest<SysDictTypeVo>({
    url: `/system/dict/type/${dictId}`,
    method: 'get',
  })
}

/** POST /system/dict/type 新增字典类型 */
export function addDictType(data: SysDictTypeBo) {
  return sysRequest<void>({ url: '/system/dict/type', method: 'post', data })
}

/** PUT /system/dict/type 修改字典类型 */
export function updateDictType(data: SysDictTypeBo) {
  return sysRequest<void>({ url: '/system/dict/type', method: 'put', data })
}

/** DELETE /system/dict/type/{dictIds} 删除字典类型（逗号分隔） */
export function deleteDictTypes(dictIds: (number | string)[]) {
  return sysRequest<void>({
    url: `/system/dict/type/${dictIds.join(',')}`,
    method: 'delete',
  })
}

/** DELETE /system/dict/type/refreshCache 刷新字典缓存 */
export function refreshDictCache() {
  return sysRequest<void>({
    url: '/system/dict/type/refreshCache',
    method: 'delete',
  })
}

/** GET /system/dict/type/optionselect 字典类型下拉列表 */
export function dictTypeOptionSelect() {
  return sysRequest<SysDictTypeVo[]>({
    url: '/system/dict/type/optionselect',
    method: 'get',
  })
}

export interface SysDictDataVo {
  dictCode: number
  dictSort?: number
  dictLabel: string
  dictValue: string
  dictType: string
  cssClass?: string
  listClass?: string
  isDefault?: string
  remark?: string
  createTime?: string
}

export interface SysDictDataQuery extends PageQuery {
  dictType?: string
  dictLabel?: string
}

export interface SysDictDataBo {
  dictCode?: number
  dictSort?: number
  dictLabel: string
  dictValue: string
  dictType: string
  cssClass?: string
  listClass?: string
  isDefault?: string
  remark?: string
}

/** GET /system/dict/data/list 分页查询字典数据 */
export function listDictData(params: SysDictDataQuery) {
  return sysList<SysDictDataVo>({
    url: '/system/dict/data/list',
    method: 'get',
    params,
  })
}

/** GET /system/dict/data/{dictCode} 字典数据详情 */
export function getDictData(dictCode: number) {
  return sysRequest<SysDictDataVo>({
    url: `/system/dict/data/${dictCode}`,
    method: 'get',
  })
}

/** POST /system/dict/data 新增字典数据 */
export function addDictData(data: SysDictDataBo) {
  return sysRequest<void>({ url: '/system/dict/data', method: 'post', data })
}

/** PUT /system/dict/data 修改字典数据 */
export function updateDictData(data: SysDictDataBo) {
  return sysRequest<void>({ url: '/system/dict/data', method: 'put', data })
}

/** DELETE /system/dict/data/{dictCodes} 删除字典数据（逗号分隔） */
export function deleteDictData(dictCodes: (number | string)[]) {
  return sysRequest<void>({
    url: `/system/dict/data/${dictCodes.join(',')}`,
    method: 'delete',
  })
}
