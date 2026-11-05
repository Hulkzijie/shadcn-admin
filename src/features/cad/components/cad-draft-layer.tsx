import { useMemo } from 'react'
import { CircleMarker, Polygon, Polyline } from 'react-leaflet'
import { CAD_DRAFT_PANE, CAD_SELECTED_COLOR } from '../config'
import { useCadState } from '../store'

/**
 * 绘制草稿预览：虚线路径 + 顶点标记。
 * 草稿层不参与交互，点击穿透到地图继续采点。
 */
export function CadDraftLayer() {
  const draft = useCadState((state) => state.draft)

  const positions = useMemo<Array<[number, number]>>(
    () => (draft?.positions ?? []).map((item) => [item.lat, item.lng]),
    [draft?.positions]
  )

  const pathOptions = useMemo(
    () => ({
      color: CAD_SELECTED_COLOR,
      weight: 2,
      opacity: 0.95,
      dashArray: '6 4',
      fillColor: CAD_SELECTED_COLOR,
      fillOpacity: 0.12,
      className: 'leaflet-scale-line',
      interactive: false,
    }),
    []
  )

  const vertexOptions = useMemo(
    () => ({
      color: CAD_SELECTED_COLOR,
      weight: 2,
      fillColor: '#0d1a24',
      fillOpacity: 1,
      interactive: false,
    }),
    []
  )

  if (!draft || positions.length === 0) return null

  return (
    <>
      {draft.drawType === '面' && positions.length >= 3 ? (
        <Polygon
          positions={positions}
          pathOptions={pathOptions}
          pane={CAD_DRAFT_PANE}
        />
      ) : (
        <Polyline
          positions={positions}
          pathOptions={pathOptions}
          pane={CAD_DRAFT_PANE}
        />
      )}
      {positions.map((position, index) => (
        <CircleMarker
          key={`${position[0]}-${position[1]}-${index}`}
          center={position}
          radius={4}
          pathOptions={vertexOptions}
          pane={CAD_DRAFT_PANE}
        />
      ))}
    </>
  )
}
