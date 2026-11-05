import type { StyleSpecification } from 'maplibre-gl'
import { BASEMAP } from '../shared/style-tokens'

/**
 * 底图样式：优先用完整 style.json，其次用瓦片模板拼一个纯栅格样式。
 * 我们的底图是自建瓦片服务（nginx 反代 + 缓存），对外只暴露 {z}/{x}/{y}，
 * 前端不接触上游地址和 tk，换源只改服务端配置或环境变量。
 */
function buildBaseStyle(): string | StyleSpecification {
  if (BASEMAP.styleUrl) return BASEMAP.styleUrl

  const raster = (id: string) => ({
    id,
    type: 'raster' as const,
    source: id,
    paint: { 'raster-resampling': 'linear' as const },
  })
  const sources: StyleSpecification['sources'] = {}
  const layers: StyleSpecification['layers'] = []

  if (BASEMAP.tileUrl) {
    sources.base = {
      type: 'raster',
      tiles: [BASEMAP.tileUrl],
      tileSize: 256,
      maxzoom: BASEMAP.maxZoom,
      attribution: BASEMAP.attribution,
    }
    layers.push(raster('base'))
  }
  // 注记单独一层，避免文字被要素图层压住
  if (BASEMAP.labelUrl) {
    sources.label = {
      type: 'raster',
      tiles: [BASEMAP.labelUrl],
      tileSize: 256,
      maxzoom: BASEMAP.maxZoom,
    }
    layers.push(raster('label'))
  }

  // 没配底图时返回空样式：点线面照常渲染，只是白底
  return { version: 8, sources, layers }
}

export const BASE_STYLE = buildBaseStyle()
