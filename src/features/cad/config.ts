import type L from 'leaflet'
import type { CadElement, EleState } from './types'

/** A3 横向图纸尺寸（mm） */
export const CAD_PAPER_SIZE_MM = { width: 420, height: 297 } as const

/** 默认出图比例 1:100 */
export const DEFAULT_CAD_SCALE_RATIO = 100

/** 1:100 下 A3 图纸对应的实际物理尺寸（m） */
export const DEFAULT_CAD_DRAW_SIZE_METERS = {
  width: (CAD_PAPER_SIZE_MM.width * DEFAULT_CAD_SCALE_RATIO) / 1000,
  height: (CAD_PAPER_SIZE_MM.height * DEFAULT_CAD_SCALE_RATIO) / 1000,
} as const

export const CAD_DEFAULT_CENTER: [number, number] = [30.584355, 114.298572]
export const CAD_MIN_ZOOM = 12
export const CAD_MAX_ZOOM = 30
export const CAD_ZOOM_SNAP = 0.5

/** 出图比例可选项 */
export const CAD_SCALE_OPTIONS = [50, 100, 200, 500, 1000] as const

/* ------------------------------- Pane 分层 ------------------------------- */

export const CAD_BASE_MAP_PANE = 'cad-base-map-pane'
export const CAD_FRAME_PANE = 'cad-frame-pane'
export const CAD_ELEMENT_PANE = 'cad-element-pane'
export const CAD_DRAFT_PANE = 'cad-draft-pane'
export const CAD_MARKER_TOP_PANE = 'cad-marker-top-pane'

/**
 * Pane 必须在图元首次挂载前创建，否则 Leaflet 会回退到默认 pane，
 * 导致底图/图框/图元层级错乱。
 */
export function initCadPanes(map: L.Map): void {
  const ensure = (name: string, zIndex: number, pointerEvents: string) => {
    if (map.getPane(name)) return
    const pane = map.createPane(name)
    pane.style.zIndex = String(zIndex)
    pane.style.pointerEvents = pointerEvents
  }
  ensure(CAD_BASE_MAP_PANE, 400, 'none')
  ensure(CAD_FRAME_PANE, 450, 'none')
  ensure(CAD_ELEMENT_PANE, 500, 'auto')
  ensure(CAD_DRAFT_PANE, 560, 'none')
  ensure(CAD_MARKER_TOP_PANE, 630, 'auto')
}

/* --------------------------------- 配色 --------------------------------- */

const COLOR_NEW = 'rgb(29, 234, 29)'
const COLOR_REUSE = '#FFA500'
const COLOR_VARIABLE = '#00FF00'
const COLOR_SELECTED = 'rgba(17, 183, 216, 1)'

export function getStateColor(state?: EleState): string {
  if (state === '利旧' || state === '现有') return COLOR_REUSE
  if (state === '变量') return COLOR_VARIABLE
  return COLOR_NEW
}

export function getMarkerColor(isSelected: boolean, state?: EleState): string {
  return isSelected ? COLOR_SELECTED : getStateColor(state)
}

export function getElementColor(
  element: CadElement,
  isSelected: boolean
): string {
  if (isSelected) return COLOR_SELECTED
  return element.drawPara?.color || getStateColor(element.eleState)
}

export const CAD_SELECTED_COLOR = COLOR_SELECTED
