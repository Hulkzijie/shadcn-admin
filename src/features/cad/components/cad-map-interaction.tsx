import { useCallback, useEffect } from 'react'
import type * as Leaflet from 'leaflet'
import { useMap, useMapEvent } from 'react-leaflet'
import { useCadState, useCadStoreApi } from '../store'
import type { CadElement } from '../types'
import { createElementId } from '../utils'

/** 画布级交互：工具光标、空白点击取消选中、绘制采点与快捷键 */
export function CadMapInteraction() {
  const map = useMap()
  const store = useCadStoreApi()
  const tool = useCadState((state) => state.tool)

  useEffect(() => {
    map.getContainer().style.cursor = tool === 'select' ? '' : 'crosshair'
  }, [map, tool])

  const handleClick = useCallback(
    (event: Leaflet.LeafletMouseEvent) => {
      const state = store.getState()
      const position = { lat: event.latlng.lat, lng: event.latlng.lng }

      if (state.tool === 'select') {
        state.setSelected([])
        return
      }

      if (state.tool === 'point' || state.tool === 'label') {
        const isLabel = state.tool === 'label'
        const element: CadElement = {
          id: createElementId(isLabel ? 'label' : 'point'),
          drawType: isLabel ? '标注点' : '点',
          theName: isLabel ? '新建标注' : '新建点',
          ...position,
          eleState: '新建',
          size: isLabel ? undefined : { width: 16, height: 16 },
          drawPara: isLabel ? { fontSize: state.fontSize } : {},
        }
        state.addElements([element])
        state.setSelected([element.id])
        return
      }

      // 线/面：连续采点，Enter 或工具栏「完成」落库
      const drawType = state.tool === 'line' ? '线' : '面'
      if (!state.draft || state.draft.drawType !== drawType) {
        state.update({ draft: { drawType, positions: [position] } })
      } else {
        state.appendDraftPoint(position)
      }
    },
    [store]
  )

  useMapEvent('click', handleClick)

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const state = store.getState()
      if (event.key === 'Enter') {
        state.commitDraft()
      } else if (event.key === 'Escape') {
        state.clearDraft()
        state.setSelected([])
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [store])

  return null
}
