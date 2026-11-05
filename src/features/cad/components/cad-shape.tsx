import { useCallback, useEffect, useMemo, useRef } from 'react'
import type * as Leaflet from 'leaflet'
import { Polygon, Polyline } from 'react-leaflet'
import { CAD_ELEMENT_PANE, getElementColor } from '../config'
import { L } from '../leaflet'
import type { CadElement, CadPosition } from '../types'
import { stopElementEvent } from '../utils'

interface CadShapeProps {
  element: CadElement
  isSelected: boolean
  draggable: boolean
  /** 绘制态下不响应选中，且不拦截地图点击 */
  selectable: boolean
  onSelect: (id: string) => void
  onMove: (id: string, positions: CadPosition[]) => void
}

/** 线/面图元共用的路径骨架 */
export function CadShape({
  element,
  isSelected,
  draggable,
  selectable,
  onSelect,
  onMove,
}: CadShapeProps) {
  const isPolygon = element.drawType === '面'
  const layerRef = useRef<Leaflet.Path | null>(null)

  const positions = useMemo<Array<[number, number]>>(
    () => (element.positions ?? []).map((item) => [item.lat, item.lng]),
    [element.positions]
  )

  const pathOptions = useMemo<Leaflet.PathOptions>(
    () => ({
      color: getElementColor(element, isSelected),
      weight: element.drawPara?.weight ?? (isSelected ? 3 : 2),
      opacity: 0.9,
      fillColor: getElementColor(element, isSelected),
      fillOpacity: isPolygon ? (isSelected ? 0.28 : 0.14) : 0,
      className: 'leaflet-scale-line',
    }),
    [element, isPolygon, isSelected]
  )

  // draggable 是构造期 option，切换工具后需手动启停拖拽
  useEffect(() => {
    const dragging = layerRef.current?.dragging as
      | { enable: () => void; disable: () => void }
      | undefined
    if (!dragging) return
    if (draggable) dragging.enable()
    else dragging.disable()
  }, [draggable])

  const setLayer = useCallback((layer: Leaflet.Path | null) => {
    layerRef.current = layer
  }, [])

  const eventHandlers = useMemo<Leaflet.LeafletEventHandlerFnMap>(
    () => ({
      click: (event) => {
        if (!selectable) return
        stopElementEvent(event as Leaflet.LeafletMouseEvent)
        onSelect(element.id)
      },
      dragend: (event) => {
        const layer = event.target as Leaflet.Polyline
        const latLngs = flattenLatLngs(layer.getLatLngs())
        onMove(
          element.id,
          latLngs.map((item) => ({ lat: item.lat, lng: item.lng }))
        )
      },
    }),
    [element.id, onMove, onSelect, selectable]
  )

  const sharedProps = {
    ref: setLayer,
    pathOptions,
    pane: CAD_ELEMENT_PANE,
    // 构造期即开启，交给 leaflet-path-transform 接管拖拽
    draggable: true,
    eventHandlers,
  } as const

  return isPolygon ? (
    <Polygon positions={positions} {...sharedProps} />
  ) : (
    <Polyline positions={positions} {...sharedProps} />
  )
}

/** 拖拽结束后 transform 插件已把矩阵位移落到坐标上，这里拍平嵌套数组 */
function flattenLatLngs(latLngs: unknown): Leaflet.LatLng[] {
  if (Array.isArray(latLngs)) {
    return latLngs.flatMap((item) => flattenLatLngs(item))
  }
  if (latLngs instanceof L.LatLng) {
    return [latLngs]
  }
  return []
}
