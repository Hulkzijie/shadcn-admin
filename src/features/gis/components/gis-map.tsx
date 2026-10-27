import { useEffect, useRef, useState } from 'react'
import type { Feature, FeatureCollection } from 'geojson'
import {
  Map,
  NavigationControl,
  ScaleControl,
  setWorkerUrl,
  type GeoJSONSource,
  type MapMouseEvent,
  type StyleSpecification,
} from 'maplibre-gl'
// maplibre-gl v6 把 worker 拆成了独立文件，经过打包器后无法自动定位；
// 不显式指定会导致 worker 加载失败、load 事件不触发（地图一直停在加载中）
import maplibreWorkerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'
import 'maplibre-gl/dist/maplibre-gl.css'
import type { GisFeature, GisLayerVo, LayerExtent, Viewport } from '../types'

setWorkerUrl(maplibreWorkerUrl)

const TILE_MAX_ZOOM = Number(import.meta.env.VITE_MAP_TILE_MAX_ZOOM ?? 18)

/**
 * 底图样式：优先用完整 style.json，其次用瓦片模板拼一个纯栅格样式。
 * 我们的底图是自建瓦片服务（nginx 反代天地图 + 缓存），对外只暴露 {z}/{x}/{y}，
 * 前端不接触上游地址和 tk，换源只改服务端配置。
 */
function buildBaseStyle(): string | StyleSpecification {
  if (import.meta.env.VITE_MAP_STYLE_URL)
    return import.meta.env.VITE_MAP_STYLE_URL

  const raster = (id: string) => ({
    id,
    type: 'raster' as const,
    source: id,
    paint: { 'raster-resampling': 'linear' as const },
  })
  const sources: StyleSpecification['sources'] = {}
  const layers: StyleSpecification['layers'] = []

  const base = import.meta.env.VITE_MAP_TILE_URL
  if (base) {
    sources.base = {
      type: 'raster',
      tiles: [base],
      tileSize: 256,
      maxzoom: TILE_MAX_ZOOM,
      attribution: import.meta.env.VITE_MAP_TILE_ATTRIBUTION ?? '© 天地图',
    }
    layers.push(raster('base'))
  }
  // 注记单独一层，避免文字被要素图层压住
  const label = import.meta.env.VITE_MAP_LABEL_TILE_URL
  if (label) {
    sources.label = {
      type: 'raster',
      tiles: [label],
      tileSize: 256,
      maxzoom: TILE_MAX_ZOOM,
    }
    layers.push(raster('label'))
  }

  // 没配底图时返回空样式：点线面照常渲染，只是白底
  return { version: 8, sources, layers }
}

const BASE_STYLE = buildBaseStyle()

const COLOR_BY_TYPE: Record<string, string> = {
  POINT: '#2563eb',
  LINE: '#16a34a',
  POLYGON: '#f59e0b',
  HEAT: '#ef4444',
  MIX: '#7c3aed',
}

interface GisMapProps {
  layers: GisLayerVo[]
  visibleLayerIds: number[]
  data?: Record<string, GisFeature[]>
  /** 上次记忆的视窗，首次可用时应用一次 */
  initialView?: { lng: number; lat: number; zoom?: number | null } | null
  /** 传入后地图会自动缩放到该范围（每次点击定位都传新对象） */
  focusExtent?: LayerExtent | null
  onViewportChange: (viewport: Viewport) => void
  onFeatureClick?: (feature: GisFeature) => void
}

export function GisMap({
  layers,
  visibleLayerIds,
  data,
  initialView,
  focusExtent,
  onViewportChange,
  onFeatureClick,
}: GisMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<Map | null>(null)
  const [ready, setReady] = useState(false)
  const [loadError, setLoadError] = useState<string | null>(null)
  // 记忆视窗只应用一次，之后交由用户拖动
  const viewAppliedRef = useRef(false)

  // 1. 初始化
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return
    const map = new Map({
      container: containerRef.current,
      style: BASE_STYLE,
      center: [116.397, 39.909],
      zoom: 10,
      attributionControl: false,
    })
    map.addControl(new NavigationControl(), 'bottom-right')
    map.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left')
    map.on('load', () => setReady(true))
    map.on('error', (e) => {
      if (!map.loaded()) setLoadError(e.error?.message ?? '地图资源加载失败')
    })
    mapRef.current = map
    return () => {
      map.remove()
      mapRef.current = null
      viewAppliedRef.current = false
      setReady(false)
      setLoadError(null)
    }
  }, [])

  // 2. 应用上次记忆的视窗（只应用一次，需在 emit 之前执行）
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || viewAppliedRef.current || !initialView) return
    const { lng, lat, zoom } = initialView
    if (lng == null || lat == null) return
    viewAppliedRef.current = true
    map.jumpTo({ center: [lng, lat], zoom: zoom ?? map.getZoom() })
  }, [ready, initialView])

  // 3. 视窗变化 -> 通知外层（外层做防抖 + 发请求）
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const emit = () => {
      const b = map.getBounds()
      onViewportChange({
        minLng: b.getWest(),
        minLat: b.getSouth(),
        maxLng: b.getEast(),
        maxLat: b.getNorth(),
        zoom: map.getZoom(),
      })
    }
    emit()
    map.on('moveend', emit)
    map.on('zoomend', emit)
    return () => {
      map.off('moveend', emit)
      map.off('zoomend', emit)
    }
  }, [ready, onViewportChange])

  // 4. 定位到图层四至
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !focusExtent) return
    const { minLng, minLat, maxLng, maxLat } = focusExtent
    if (minLng == null || minLat == null || maxLng == null || maxLat == null) {
      return
    }
    map.fitBounds(
      [
        [minLng, minLat],
        [maxLng, maxLat],
      ],
      { padding: 64, maxZoom: 16, duration: 600 }
    )
  }, [ready, focusExtent])

  // 5. 数据 -> GeoJSON source
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !data) return

    for (const layer of layers) {
      if (!visibleLayerIds.includes(layer.id)) {
        removeLayer(map, layer.id)
        continue
      }
      const rows = data[String(layer.id)] ?? []
      const fc: FeatureCollection = {
        type: 'FeatureCollection',
        features: rows
          .filter((r) => r.geometry || (r.lng != null && r.lat != null))
          .map((r) => toGeoJsonFeature(r)),
      }
      upsertLayer(map, layer, fc)
    }
  }, [data, layers, visibleLayerIds, ready])

  // 6. 点击要素
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !onFeatureClick) return
    const handler = (e: MapMouseEvent) => {
      const hit = map.queryRenderedFeatures(e.point)[0]
      const raw = hit?.properties?.__payload
      if (raw) onFeatureClick(JSON.parse(String(raw)) as GisFeature)
    }
    map.on('click', handler)
    return () => {
      map.off('click', handler)
    }
  }, [ready, onFeatureClick])

  return (
    <>
      <div ref={containerRef} className='h-full w-full' />
      {!ready && (
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center px-6 text-center text-sm text-muted-foreground'>
          {loadError ? `地图加载失败：${loadError}` : '地图加载中…'}
        </div>
      )}
    </>
  )
}

/* ---------------- 内部工具 ---------------- */

function sourceId(layerId: number) {
  return `gis-src-${layerId}`
}

function toGeoJsonFeature(r: GisFeature): Feature {
  const geometry =
    r.geometry ??
    ({
      type: 'Point',
      coordinates: [Number(r.lng), Number(r.lat)],
    } as const)

  return {
    type: 'Feature',
    id: typeof r.id === 'number' ? r.id : undefined,
    geometry: geometry as Feature['geometry'],
    properties: {
      __payload: JSON.stringify(r),
      count: r.count ?? null,
      theName: r.theName ?? '',
    },
  }
}

function upsertLayer(map: Map, layer: GisLayerVo, fc: FeatureCollection) {
  const src = sourceId(layer.id)
  const color = COLOR_BY_TYPE[layer.layerType] ?? '#2563eb'

  const existing = map.getSource(src)
  if (existing) {
    ;(existing as GeoJSONSource).setData(fc)
    return
  }

  map.addSource(src, { type: 'geojson', data: fc })

  // 聚合计数（后端返回 cluster + count 的聚合点）
  if (layer.clusterLevel != null && layer.clusterLevel > 0) {
    map.addLayer({
      id: `${src}-circle`,
      type: 'circle',
      source: src,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', 'count'], 1],
          1,
          14,
          1000,
          32,
        ],
        'circle-color': color,
        'circle-opacity': 0.7,
        'circle-stroke-width': 1,
        'circle-stroke-color': '#ffffff',
      },
    })
    map.addLayer({
      id: `${src}-count`,
      type: 'symbol',
      source: src,
      layout: {
        'text-field': ['to-string', ['get', 'count']],
        'text-size': 11,
      },
      paint: { 'text-color': '#ffffff' },
    })
    return
  }

  map.addLayer({
    id: `${src}-point`,
    type: 'circle',
    source: src,
    filter: ['==', ['geometry-type'], 'Point'],
    paint: {
      'circle-radius': 5,
      'circle-color': color,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#ffffff',
    },
  })
  map.addLayer({
    id: `${src}-line`,
    type: 'line',
    source: src,
    filter: ['==', ['geometry-type'], 'LineString'],
    paint: { 'line-color': color, 'line-width': 2 },
  })
  map.addLayer({
    id: `${src}-fill`,
    type: 'fill',
    source: src,
    filter: ['==', ['geometry-type'], 'Polygon'],
    paint: { 'fill-color': color, 'fill-opacity': 0.25 },
  })
}

function removeLayer(map: Map, layerId: number) {
  const src = sourceId(layerId)
  for (const suffix of ['-point', '-circle', '-line', '-fill', '-count']) {
    if (map.getLayer(src + suffix)) map.removeLayer(src + suffix)
  }
  if (map.getSource(src)) map.removeSource(src)
}
