import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  createLeafletContext,
  LeafletContext,
  type LeafletContextInterface,
} from '@react-leaflet/core'
import type * as Leaflet from 'leaflet'
import {
  CAD_MAX_ZOOM,
  CAD_MIN_ZOOM,
  CAD_ZOOM_SNAP,
  initCadPanes,
} from '../config'
import { L } from '../leaflet'
import { useCadStoreApi } from '../store'
import { getCadViewportFitZoom } from '../viewport'

interface CadMapContainerProps {
  /** 图纸地理边界，用于首屏适配 */
  bounds: Leaflet.LatLngBounds
  className?: string
  children: ReactNode
}

/**
 * 自建地图容器：
 * react-leaflet 的 MapContainer 在 React StrictMode 下会因 effect 双执行
 * 而 remove 掉地图且不再重建（mapInstanceRef 未复位），因此这里自行
 * 管理 L.Map 生命周期，只借用它的 LeafletContext 给子图层使用。
 */
export function CadMapContainer({
  bounds,
  className,
  children,
}: CadMapContainerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const store = useCadStoreApi()
  // 图纸边界只在首次挂载时用于适配，后续视角由用户操作接管
  const initialBoundsRef = useRef(bounds)
  const [context, setContext] = useState<LeafletContextInterface | null>(null)

  useEffect(() => {
    const node = containerRef.current
    if (!node) return

    const map = L.map(node, {
      minZoom: CAD_MIN_ZOOM,
      maxZoom: CAD_MAX_ZOOM,
      zoomSnap: CAD_ZOOM_SNAP,
      zoomControl: false,
      attributionControl: false,
      doubleClickZoom: false,
    })

    // 必须在图元挂载前建好 pane，否则图层会落入默认 pane
    initCadPanes(map)

    // 先把视角与缩放基准算好，子图元挂载时即为正确比例，避免闪缩
    const initialBounds = initialBoundsRef.current
    const fitZoom = getCadViewportFitZoom(map, initialBounds)
    map.setView(initialBounds.getCenter(), fitZoom, { animate: false })

    store.getState().update({ map, baseZoom: fitZoom })
    setContext(createLeafletContext(map))

    return () => {
      store.getState().update({ map: null })
      setContext(null)
      map.remove()
    }
  }, [store])

  return (
    <div ref={containerRef} className={className}>
      {context ? (
        <LeafletContext.Provider value={context}>
          {children}
        </LeafletContext.Provider>
      ) : null}
    </div>
  )
}
