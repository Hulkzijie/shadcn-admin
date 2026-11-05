/** 双栈（MapLibre 预览 / OpenLayers 编辑）共用的视觉与底图配置 */

/** 图层类型 -> 颜色 */
export const COLOR_BY_TYPE: Record<string, string> = {
  POINT: '#2563eb',
  LINE: '#16a34a',
  POLYGON: '#f59e0b',
  HEAT: '#ef4444',
  MIX: '#7c3aed',
}

export function colorOf(layerType?: string) {
  return COLOR_BY_TYPE[layerType ?? ''] ?? '#2563eb'
}

/**
 * 底图配置：优先使用完整 style.json（MapLibre 专用），
 * 否则用 {z}/{x}/{y} 模板拼纯栅格底图。
 * 前端只认相对路径，换源（天地图/OSM/CARTO）只改环境变量。
 */
export const BASEMAP = {
  styleUrl: import.meta.env.VITE_MAP_STYLE_URL as string | undefined,
  tileUrl: import.meta.env.VITE_MAP_TILE_URL as string | undefined,
  labelUrl: import.meta.env.VITE_MAP_LABEL_TILE_URL as string | undefined,
  maxZoom: Number(import.meta.env.VITE_MAP_TILE_MAX_ZOOM ?? 18),
  attribution:
    (import.meta.env.VITE_MAP_TILE_ATTRIBUTION as string | undefined) ??
    '© 天地图',
}

/** 默认中心（北京） */
export const DEFAULT_CENTER: [number, number] = [116.397, 39.909]
export const DEFAULT_ZOOM = 10
