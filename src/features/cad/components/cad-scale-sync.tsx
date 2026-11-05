import { useCallback, useEffect } from 'react'
import { useMap, useMapEvent } from 'react-leaflet'
import { useCadState } from '../store'
import { applyScaleVars } from '../viewport'

/** 缩放同步：把当前缩放级别换算成 CSS 变量，驱动图元随底图缩放 */
export function CadScaleSync() {
  const map = useMap()
  const baseZoom = useCadState((state) => state.baseZoom)

  const sync = useCallback(() => {
    applyScaleVars(map, baseZoom)
  }, [map, baseZoom])

  useEffect(() => {
    sync()
  }, [sync])

  useMapEvent('zoomend', sync)

  return null
}
