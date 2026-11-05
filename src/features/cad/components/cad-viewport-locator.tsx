import { useEffect, useMemo } from 'react'
import { useMap } from 'react-leaflet'
import { useCadStoreApi } from '../store'
import type { CadBoundary } from '../types'
import { applyScaleVars, boundaryToBounds } from '../viewport'

/**
 * 图纸视口校正：
 * 容器尺寸变化时（如侧边栏折叠、标签页切换后）重新计算 Leaflet 尺寸，
 * 并同步图元缩放变量，避免地图错位。
 */
export function CadViewportLocator({ boundary }: { boundary: CadBoundary }) {
  const map = useMap()
  const store = useCadStoreApi()
  const bounds = useMemo(() => boundaryToBounds(boundary), [boundary])

  useEffect(() => {
    map.invalidateSize()
    applyScaleVars(map, store.getState().baseZoom)
  }, [map, bounds, store])

  useEffect(() => {
    const container = map.getContainer()
    const observer = new ResizeObserver(() => {
      map.invalidateSize()
      applyScaleVars(map, store.getState().baseZoom)
    })
    observer.observe(container)
    return () => observer.disconnect()
  }, [map, store])

  return null
}
