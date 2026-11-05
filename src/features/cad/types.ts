/** CAD 图元状态（沿用源项目配色语义：利旧/现有=橙，变量=亮绿，新建=绿） */
export type EleState = '新建' | '利旧' | '现有' | '变量'

/** 当前复刻范围内支持的图元类型 */
export type CadDrawType = '点' | '线' | '面' | '标注点' | '文本框'

/** 画布工具模式 */
export type CadTool = 'select' | 'point' | 'line' | 'polygon' | 'label'

export interface CadPosition {
  lat: number
  lng: number
}

export interface CadSize {
  width: number
  height: number
}

export interface CadDrawPara {
  color?: string
  weight?: number
  label?: string
  fontSize?: number
  rotate?: number
  scale?: number
}

export interface CadElement {
  id: string
  theName?: string
  drawType: CadDrawType
  /** 点/标注类图元的锚点 */
  lat: number
  lng: number
  /** 线/面图元的顶点集合 */
  positions?: CadPosition[]
  size?: CadSize
  eleState?: EleState
  drawPara?: CadDrawPara
}

/**
 * 图纸边界，沿用源项目的元组约定：
 * [minLng, maxLng, minLat, maxLat, baseZoom?, fontSize?]
 */
export type CadBoundary = [
  number,
  number,
  number,
  number,
  number?,
  number?,
]
