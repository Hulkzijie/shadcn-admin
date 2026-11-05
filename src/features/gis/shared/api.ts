import {
  sysList,
  sysRequest,
  type PageQuery,
} from '@/features/system/shared/api'
import type {
  FeatureSavePayload,
  GisFeature,
  GisLayerVo,
  GisUserView,
  GisUserViewPayload,
  LayerExtent,
  LayerSavePayload,
  WindowQuery,
} from './types'

/* ---------------- 图层 ---------------- */

/** 当前用户可见的全部图层（地图初始化用，登录即可） */
export function listVisibleLayers() {
  return sysRequest<GisLayerVo[]>({
    url: '/gis/layer/visible',
    method: 'get',
  })
}

/** 图层分页（图层管理页用，权限 gis:layer:list） */
export function pageLayers(
  params: PageQuery & { layerName?: string; layerType?: string } = {}
) {
  return sysList<GisLayerVo>({
    url: '/gis/layer/list',
    method: 'get',
    params,
  })
}

/** 图层详情（权限 gis:layer:query） */
export function getLayer(id: number) {
  return sysRequest<GisLayerVo>({
    url: `/gis/layer/${id}`,
    method: 'get',
  })
}

/** 新增图层（权限 gis:layer:add），返回图层 id */
export function createLayer(payload: LayerSavePayload) {
  return sysRequest<number>({
    url: '/gis/layer',
    method: 'post',
    data: payload,
  })
}

/** 修改图层（权限 gis:layer:edit） */
export function updateLayer(payload: LayerSavePayload) {
  return sysRequest<void>({
    url: '/gis/layer',
    method: 'put',
    data: payload,
  })
}

/** 删除图层（权限 gis:layer:remove） */
export function deleteLayer(id: number) {
  return sysRequest<void>({
    url: `/gis/layer/${id}`,
    method: 'delete',
  })
}

/** 清空图层下全部要素（权限 gis:layer:remove） */
export function clearLayer(id: number) {
  return sysRequest<void>({
    url: `/gis/layer/${id}/clear`,
    method: 'delete',
  })
}

/** 图层四至（登录即可），返回 { minLng, minLat, maxLng, maxLat } */
export function getLayerExtent(id: number) {
  return sysRequest<LayerExtent>({
    url: `/gis/layer/${id}/extent`,
    method: 'get',
  })
}

/* ---------------- 要素 ---------------- */

/**
 * 视窗查询：返回 { [layerId]: GisFeature[] }
 * 后端按当前用户可见范围过滤，只返回 bbox 内的要素。
 */
export function queryWindow(payload: WindowQuery) {
  return sysRequest<Record<string, GisFeature[]>>({
    url: '/gis/feature/window',
    method: 'post',
    data: payload,
  })
}

/**
 * 单个要素详情。
 * 统一表（UNIFIED）可由 id 反查图层；复用原表（LEGACY）的图层必须传 layerId。
 */
export function getFeature(id: number | string, layerId?: number) {
  return sysRequest<GisFeature>({
    url: `/gis/feature/${id}`,
    method: 'get',
    params: layerId ? { layerId } : undefined,
  })
}

/** 新增要素（权限 gis:feature:add），返回要素 id */
export function createFeature(payload: FeatureSavePayload) {
  return sysRequest<number>({
    url: '/gis/feature',
    method: 'post',
    data: payload,
  })
}

/** 修改要素（权限 gis:feature:edit） */
export function updateFeature(payload: FeatureSavePayload) {
  return sysRequest<void>({
    url: '/gis/feature',
    method: 'put',
    data: payload,
  })
}

/** 删除要素（权限 gis:feature:remove），LEGACY 图层需带 layerId */
export function deleteFeature(id: number | string, layerId?: number) {
  return sysRequest<void>({
    url: `/gis/feature/${id}`,
    method: 'delete',
    params: layerId ? { layerId } : undefined,
  })
}

/* ---------------- 用户视图记忆 ---------------- */

/** 上次进入地图时的视窗与图层勾选，首次使用返回 null */
export function getUserView() {
  return sysRequest<GisUserView | null>({
    url: '/gis/view',
    method: 'get',
  })
}

/** 保存视窗与图层勾选（拖动/勾选后静默调用） */
export function saveUserView(payload: GisUserViewPayload) {
  return sysRequest<void>({
    url: '/gis/view',
    method: 'put',
    data: payload,
  })
}
