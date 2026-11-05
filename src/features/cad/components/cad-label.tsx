import { useMemo } from 'react'
import type * as Leaflet from 'leaflet'
import { Marker } from 'react-leaflet'
import { CAD_MARKER_TOP_PANE, CAD_SELECTED_COLOR } from '../config'
import { L } from '../leaflet'
import type { CadElement, CadPosition } from '../types'
import { escapeHtml, stopElementEvent } from '../utils'

interface CadLabelProps {
  element: CadElement
  isSelected: boolean
  draggable: boolean
  /** 绘制态下不响应选中，且不拦截地图点击 */
  selectable: boolean
  onSelect: (id: string) => void
  onMove: (id: string, position: CadPosition) => void
}

/** 标注点：文字随图纸缩放，锚点保持在文字中心 */
export function CadLabel({
  element,
  isSelected,
  draggable,
  selectable,
  onSelect,
  onMove,
}: CadLabelProps) {
  const text = element.theName ?? '标注'
  const fontSize = element.drawPara?.fontSize ?? 12
  const color = isSelected
    ? CAD_SELECTED_COLOR
    : (element.drawPara?.color ?? '#e2e8f0')

  const icon = useMemo(
    () =>
      L.divIcon({
        className: 'cad-label-icon',
        iconSize: [0, 0],
        iconAnchor: [0, 0],
        html: `<div class="leaflet-scale-marker"><div style="transform:translate(-50%,-50%);font-size:${fontSize}px;line-height:1.2;color:${color};white-space:nowrap;padding:1px 4px;border-radius:3px;${isSelected ? `background:rgba(17,183,216,0.18);outline:1px solid ${CAD_SELECTED_COLOR}` : 'text-shadow:0 1px 2px rgba(0,0,0,0.75)'}">${escapeHtml(text)}</div></div>`,
      }),
    [color, fontSize, isSelected, text]
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
