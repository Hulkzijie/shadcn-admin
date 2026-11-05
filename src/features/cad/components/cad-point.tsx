import { useMemo } from 'react'
import type * as Leaflet from 'leaflet'
import { Marker } from 'react-leaflet'
import { CAD_MARKER_TOP_PANE, getMarkerColor } from '../config'
import { L } from '../leaflet'
import type { CadElement, CadPosition } from '../types'
import { stopElementEvent } from '../utils'

interface CadPointProps {
  element: CadElement
  isSelected: boolean
  draggable: boolean
  /** 绘制态下不响应选中，且不拦截地图点击 */
  selectable: boolean
  onSelect: (id: string) => void
  onMove: (id: string, position: CadPosition) => void
}

/**
 * 点图元：沿用源项目的保真写法 —— iconSize/iconAnchor 置 0，
 * 内层 translate(-50%,-50%) 居中，外层 .leaflet-scale-marker 承接缩放变量。
 */
export function CadPoint({
  element,
  isSelected,
  draggable,
  selectable,
  onSelect,
  onMove,
}: CadPointProps) {
  const width = element.size?.width ?? 16
  const height = element.size?.height ?? 16
  const rotate = element.drawPara?.rotate ?? 0
  const color = getMarkerColor(isSelected, element.eleState)

  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'cad-point-icon',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        html: `<div class="leaflet-scale-marker"><div style="width:${width}px;height:${height}px;transform:translate(-50%,-50%) rotate(${rotate}deg);border-radius:50%;border:2px solid ${color};background:radial-gradient(circle, #0d1a24 0 38%, ${color} 40% 100%);box-shadow:0 0 6px ${color}${isSelected ? ';outline:2px solid rgba(17,183,216,0.35);outline-offset:2px' : ''}"></div></div>`,
      }),
    [color, isSelected, rotate, width, height]
  )

  const position = useMemo<[number, number]>(
    () => [element.lat, element.lng],
    [element.lat, element.lng]
  )

  const eventHandlers = useMemo<Leaflet.LeafletEventHandlerFnMap>(
    () => ({
      click: (event) => {
        if (!selectable) return
        stopElementEvent(event as Leaflet.LeafletMouseEvent)
        onSelect(element.id)
      },
      dragend: (event) => {
        const latLng = (event.target as Leaflet.Marker).getLatLng()
        onMove(element.id, { lat: latLng.lat, lng: latLng.lng })
      },
    }),
    [element.id, onMove, onSelect, selectable]
  )

  return (
    <Marker
      position={position}
      icon={icon}
      pane={CAD_MARKER_TOP_PANE}
      draggable={draggable}
      zIndexOffset={isSelected ? 1000 : 0}
      eventHandlers={eventHandlers}
    />
  )
}
