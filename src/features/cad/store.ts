import { createContext, useContext } from 'react'
import type L from 'leaflet'
import { createStore, useStore, type StoreApi } from 'zustand'
import { DEFAULT_CAD_SCALE_RATIO } from './config'
import type { CadBoundary, CadElement, CadPosition, CadTool } from './types'
import { createElementId } from './utils'

export interface CadDraft {
  drawType: '线' | '面'
  positions: CadPosition[]
}

export interface CadState {
  /** 图元列表 */
  elementList: CadElement[]
  /** 选中图元 id */
  selectedIds: string[]
  /** 当前工具模式 */
  tool: CadTool
  /** 正在绘制的草稿（线/面） */
  draft: CadDraft | null
  /** 出图比例 1:N */
  scaleRatio: number
  /** 图纸适配缩放，图元同步缩放的基准 */
  baseZoom: number
  /** 图元基础字号 */
  fontSize: number
  /** 图纸边界 [minLng, maxLng, minLat, maxLat, baseZoom?, fontSize?] */
  boundary: CadBoundary | null
  /** Leaflet 地图实例 */
  map: L.Map | null

  update: (
    patch: Partial<CadState> | ((state: CadState) => Partial<CadState>)
  ) => void
  addElements: (elements: CadElement[]) => void
  updateElement: (id: string, patch: Partial<CadElement>) => void
  removeElements: (ids: string[]) => void
  setSelected: (ids: string[]) => void
  toggleSelected: (id: string) => void
  appendDraftPoint: (position: CadPosition) => void
  /** 把当前草稿落成图元；顶点数不足时不产生图元 */
  commitDraft: () => void
  clearDraft: () => void
}

export type CadStoreApi = StoreApi<CadState>

export function createCadStore(initial?: Partial<CadState>): CadStoreApi {
  return createStore<CadState>()((set) => ({
    elementList: [],
    selectedIds: [],
    tool: 'select',
    draft: null,
    scaleRatio: DEFAULT_CAD_SCALE_RATIO,
    baseZoom: 12,
    fontSize: 12,
    boundary: null,
    map: null,
    ...initial,

    update: (patch) =>
      set((state) => (typeof patch === 'function' ? patch(state) : patch)),
    addElements: (elements) =>
      set((state) => ({ elementList: [...state.elementList, ...elements] })),
    updateElement: (id, patch) =>
      set((state) => ({
        elementList: state.elementList.map((element) =>
          element.id === id ? { ...element, ...patch } : element
        ),
      })),
    removeElements: (ids) =>
      set((state) => ({
        elementList: state.elementList.filter(
          (element) => !ids.includes(element.id)
        ),
        selectedIds: state.selectedIds.filter((id) => !ids.includes(id)),
      })),
    setSelected: (ids) => set({ selectedIds: ids }),
    toggleSelected: (id) =>
      set((state) => ({
        selectedIds: state.selectedIds.includes(id)
          ? state.selectedIds.filter((item) => item !== id)
          : [...state.selectedIds, id],
      })),
    appendDraftPoint: (position) =>
      set((state) => ({
        draft: state.draft
          ? { ...state.draft, positions: [...state.draft.positions, position] }
          : state.draft,
      })),
    commitDraft: () =>
      set((state) => {
        const draft = state.draft
        if (!draft) return {}
        const minPoints = draft.drawType === '面' ? 3 : 2
        const anchor = draft.positions[0]
        if (!anchor || draft.positions.length < minPoints) return {}

        const isPolygon = draft.drawType === '面'
        const element: CadElement = {
          id: createElementId(isPolygon ? 'face' : 'line'),
          drawType: draft.drawType,
          theName: isPolygon ? '新建面' : '新建线',
          lat: anchor.lat,
          lng: anchor.lng,
          positions: draft.positions,
          eleState: '新建',
          drawPara: { weight: 2 },
        }

        return {
          elementList: [...state.elementList, element],
          draft: null,
          selectedIds: [element.id],
        }
      }),
    clearDraft: () => set({ draft: null }),
  }))
}

export const CadStoreContext = createContext<CadStoreApi | null>(null)

export function useCadStoreApi(): CadStoreApi {
  const store = useContext(CadStoreContext)
  if (!store) {
    throw new Error('CAD 组件必须包裹在 <CadStoreProvider> 内使用')
  }
  return store
}

export function useCadState<T>(selector: (state: CadState) => T): T {
  return useStore(useCadStoreApi(), selector)
}
