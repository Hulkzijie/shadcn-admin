import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
  createFeature,
  deleteFeature,
  getLayerExtent,
  getUserView,
  listVisibleLayers,
  queryWindow,
  saveUserView,
  updateFeature,
} from './api'
import type { FeatureSavePayload, GisUserViewPayload, Viewport } from './types'

export const gisKeys = {
  layers: ['gis', 'layers'] as const,
  view: ['gis', 'view'] as const,
  extent: (layerId: number) => ['gis', 'extent', layerId] as const,
  window: (viewport: Viewport | null, layerIds: number[]) =>
    ['gis', 'window', viewport, layerIds] as const,
}

/** 当前用户可见图层 */
export function useVisibleLayers() {
  return useQuery({
    queryKey: gisKeys.layers,
    queryFn: listVisibleLayers,
    staleTime: 60_000,
  })
}

/** 上次进入地图时的视窗与图层勾选（首次为 null） */
export function useUserView() {
  return useQuery({
    queryKey: gisKeys.view,
    queryFn: getUserView,
    staleTime: Infinity,
    // 老后端没有该接口时静默降级，不影响地图使用
    retry: false,
  })
}

/** 保存视窗与图层勾选（静默，不弹提示） */
export function useSaveUserView() {
  return useMutation<void, Error, GisUserViewPayload>({
    mutationFn: saveUserView,
  })
}

/** 地图视窗内的要素，按图层分组返回 */
export function useWindowFeatures(
  viewport: Viewport | null,
  layerIds: number[]
) {
  return useQuery({
    queryKey: gisKeys.window(viewport, layerIds),
    queryFn: () =>
      queryWindow({
        ...(viewport as Viewport),
        layerIds,
        zoom: viewport?.zoom,
      }),
    enabled: !!viewport && layerIds.length > 0,
    // 拖动地图时保留上一帧，避免闪空
    placeholderData: (prev) => prev,
    staleTime: 5_000,
  })
}

/** 图层四至（定位图层用） */
export function useLayerExtent(layerId: number | null) {
  return useQuery({
    queryKey: gisKeys.extent(layerId as number),
    queryFn: () => getLayerExtent(layerId as number),
    enabled: !!layerId,
    staleTime: 60_000,
  })
}

/** 保存要素（新增/修改） */
export function useSaveFeature() {
  const queryClient = useQueryClient()
  return useMutation<number | void, Error, FeatureSavePayload>({
    mutationFn: (payload) =>
      payload.id ? updateFeature(payload) : createFeature(payload),
    onSuccess: (_data, payload) => {
      toast.success(payload.id ? '要素已更新' : '要素已创建')
      queryClient.invalidateQueries({ queryKey: ['gis', 'window'] })
    },
    onError: (error: Error) => toast.error(error.message || '保存要素失败'),
  })
}

/** 删除要素（LEGACY 图层需传 layerId） */
export function useDeleteFeature() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, layerId }: { id: number | string; layerId?: number }) =>
      deleteFeature(id, layerId),
    onSuccess: () => {
      toast.success('要素已删除')
      queryClient.invalidateQueries({ queryKey: ['gis', 'window'] })
    },
    onError: (error: Error) => toast.error(error.message || '删除要素失败'),
  })
}
