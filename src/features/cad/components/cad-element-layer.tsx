import { useCallback } from 'react'
import { useCadState, useCadStoreApi } from '../store'
import type { CadPosition } from '../types'
import { CadLabel } from './cad-label'
import { CadPoint } from './cad-point'
import { CadShape } from './cad-shape'

/** 按 drawType 分发渲染图元，并统一处理选中 / 位置回写 */
export function CadElementLayer() {
  const elements = useCadState((state) => state.elementList)
  const selectedIds = useCadState((state) => state.selectedIds)
  const tool = useCadState((state) => state.tool)
  const store = useCadStoreApi()
  const draggable = tool === 'select'
  const selectable = tool === 'select'

  const handleSelect = useCallback(
    (id: string) => {
      store.getState().setSelected([id])
    },
    [store]
  )

  const handleMovePoint = useCallback(
    (id: string, position: CadPosition) => {
      store.getState().updateElement(id, {
        lat: position.lat,
        lng: position.lng,
      })
    },
    [store]
  )

  const handleMoveShape = useCallback(
    (id: string, positions: CadPosition[]) => {
      const anchor = positions[0]
      store
        .getState()
        .updateElement(
          id,
          anchor
            ? { positions, lat: anchor.lat, lng: anchor.lng }
            : { positions }
        )
    },
    [store]
  )

  return (
    <>
      {elements.map((element) => {
        const isSelected = selectedIds.includes(element.id)

        if (element.drawType === '线' || element.drawType === '面') {
          return (
            <CadShape
              key={element.id}
              element={element}
              isSelected={isSelected}
              draggable={draggable}
              selectable={selectable}
              onSelect={handleSelect}
              onMove={handleMoveShape}
            />
          )
        }

        if (element.drawType === '标注点' || element.drawType === '文本框') {
          return (
            <CadLabel
              key={element.id}
              element={element}
              isSelected={isSelected}
              draggable={draggable}
              selectable={selectable}
              onSelect={handleSelect}
              onMove={handleMovePoint}
            />
          )
        }

        return (
          <CadPoint
            key={element.id}
            element={element}
            isSelected={isSelected}
            draggable={draggable}
            selectable={selectable}
            onSelect={handleSelect}
            onMove={handleMovePoint}
          />
        )
      })}
    </>
  )
}
