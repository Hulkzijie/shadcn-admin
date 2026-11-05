import { useMemo } from 'react'
import { ImageOverlay } from 'react-leaflet'
import { CAD_BASE_MAP_PANE } from '../config'
import { MOCK_BASE_MAP_URL } from '../data/mock-drawing'
import type { CadBoundary } from '../types'
import { boundaryToBounds } from '../viewport'

/** 图纸底图：贴在图纸地理边界上的栅格图（当前为内联 SVG 蓝图） */
export function CadImageOverlay({
  boundary,
  url = MOCK_BASE_MAP_URL,
}: {
  boundary: CadBoundary
  url?: string
}) {
  const bounds = useMemo(() => boundaryToBounds(boundary), [boundary])
  return (
    <ImageOverlay
      url={url}
      bounds={bounds}
      opacity={0.9}
      pane={CAD_BASE_MAP_PANE}
      interactive={false}
    />
  )
}
