import { useEffect, useRef, useState } from 'react'
import type Feature from 'ol/Feature'
import OlMap from 'ol/Map'
import View from 'ol/View'
import { click } from 'ol/events/condition'
import GeoJSON from 'ol/format/GeoJSON'
import type Geometry from 'ol/geom/Geometry'
import Draw from 'ol/interaction/Draw'
import Modify from 'ol/interaction/Modify'
import Select from 'ol/interaction/Select'
import TileLayer from 'ol/layer/Tile'
import VectorLayer from 'ol/layer/Vector'
import 'ol/ol.css'
import { fromLonLat, transformExtent } from 'ol/proj'
import VectorSource from 'ol/source/Vector'
import XYZ from 'ol/source/XYZ'
import CircleStyle from 'ol/style/Circle'
import Fill from 'ol/style/Fill'
import Stroke from 'ol/style/Stroke'
import Style from 'ol/style/Style'
import {
  BASEMAP,
  colorOf,
  DEFAULT_CENTER,
  DEFAULT_ZOOM,
} from '../shared/style-tokens'
import type {
  Geometry as GeometryJson,
  GisFeature,
  GisLayerVo,
  LayerExtent,
  Viewport,
} from '../shared/types'

const DATA_PROJECTION = 'EPSG:4326'
const MAP_PROJECTION = 'EPSG:3857'
const geojsonFormat = new GeoJSON()

export type DrawKind = 'Point' | 'LineString' | 'Polygon'

const SELECT_STYLE = new Style({
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({ color: '#f97316' }),
    stroke: new Stroke({ color: '#ffffff', width: 2 }),
  }),
  stroke: new Stroke({ color: '#f97316', width: 3 }),
  fill: new Fill({ color: 'rgba(249, 115, 22, 0.28)' }),
})

function layerStyle(color: string) {
  return new Style({
    image: new CircleStyle({
      radius: 5,
      fill: new Fill({ color }),
      stroke: new Stroke({ color: '#ffffff', width: 1 }),
    }),
    stroke: new Stroke({ color, width: 2 }),
    fill: new Fill({ color: hexToRgba(color, 0.25) }),
  })
}

interface LayerEntry {
  source: VectorSource
  layer: VectorLayer<VectorSource>
}

interface EditorMapProps {
  layers: GisLayerVo[]
  visibleLayerIds: number[]
  data?: Record<string, GisFeature[]>
  initialView?: { lng: number; lat: number; zoom?: number | null } | null
  focusExtent?: LayerExtent | null
  /** 当前正在编辑的图层（绘制/修改/删除都作用在它上面） */
  activeLayerId: number | null
  /** 当前绘制模式，null 表示只选择不绘制 */
  drawType: DrawKind | null
  onViewportChange?: (viewport: Viewport) => void
  onFeatureSelect?: (feature: GisFeature | null) => void
  /** 绘制完成，拿到 WGS84 GeoJSON 几何 */
  onDrawEnd?: (geometry: GeometryJson) => void
  /** 顶点修改完成 */
  onFeatureModify?: (feature: GisFeature, geometry: GeometryJson) => void
}

/**
 * 编辑/编制页：OpenLayers 负责绘制、顶点修改、捕捉，
 * 保存仍然走后端统一接口（useSaveFeature / useDeleteFeature）。
 */
export function EditorMap({
  layers,
  visibleLayerIds,
  data,
  initialView,
  focusExtent,
  activeLayerId,
  drawType,
  onViewportChange,
  onFeatureSelect,
  onDrawEnd,
  onFeatureModify,
}: EditorMapProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<OlMap | null>(null)
  const layerEntriesRef = useRef(new Map<number, LayerEntry>())
  const selectRef = useRef<Select | null>(null)
  const [ready, setReady] = useState(false)
  const viewAppliedRef = useRef(false)

  // 回调放进 ref，避免因函数身份变化导致交互被反复重建（选中态丢失）
  const callbacksRef = useRef({
    onViewportChange,
    onFeatureSelect,
    onDrawEnd,
    onFeatureModify,
  })
  useEffect(() => {
    callbacksRef.current = {
      onViewportChange,
      onFeatureSelect,
      onDrawEnd,
      onFeatureModify,
    }
  }, [onViewportChange, onFeatureSelect, onDrawEnd, onFeatureModify])

  // 1. 初始化地图与底图
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return

    const entries = layerEntriesRef.current
    const tileLayers: TileLayer<XYZ>[] = []
    if (BASEMAP.tileUrl) {
      tileLayers.push(
        new TileLayer({
          source: new XYZ({
            url: BASEMAP.tileUrl,
            maxZoom: BASEMAP.maxZoom,
            attributions: BASEMAP.attribution,
          }),
        })
      )
    }
    if (BASEMAP.labelUrl) {
      tileLayers.push(
        new TileLayer({
          source: new XYZ({
            url: BASEMAP.labelUrl,
            maxZoom: BASEMAP.maxZoom,
          }),
        })
      )
    }

    const map = new OlMap({
      target: containerRef.current,
      layers: [...tileLayers],
      view: new View({
        center: fromLonLat(DEFAULT_CENTER),
        zoom: DEFAULT_ZOOM,
        maxZoom: BASEMAP.maxZoom,
      }),
      controls: [],
    })
    mapRef.current = map

    const resizeObserver = new ResizeObserver(() => map.updateSize())
    resizeObserver.observe(containerRef.current)

    map.once('postrender', () => setReady(true))

    return () => {
      resizeObserver.disconnect()
      map.setTarget(undefined)
      mapRef.current = null
      entries.clear()
      selectRef.current = null
      viewAppliedRef.current = false
      setReady(false)
    }
  }, [])

  // 2. 应用上次记忆的视窗（只应用一次）
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || viewAppliedRef.current || !initialView) return
    const { lng, lat, zoom } = initialView
    if (lng == null || lat == null) return
    viewAppliedRef.current = true
    const view = map.getView()
    view.setCenter(fromLonLat([lng, lat]))
    if (zoom != null) view.setZoom(zoom)
  }, [ready, initialView])

  // 3. 视窗变化 -> 通知外层（外层做防抖）
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const emit = () => {
      const size = map.getSize()
      if (!size) return
      const view = map.getView()
      const [minLng, minLat, maxLng, maxLat] = transformExtent(
        view.calculateExtent(size),
        MAP_PROJECTION,
        DATA_PROJECTION
      )
      callbacksRef.current.onViewportChange?.({
        minLng,
        minLat,
        maxLng,
        maxLat,
        zoom: view.getZoom() ?? DEFAULT_ZOOM,
      })
    }
    emit()
    map.on('moveend', emit)
    return () => {
      map.un('moveend', emit)
    }
  }, [ready])

  // 4. 定位到图层四至
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !focusExtent) return
    const { minLng, minLat, maxLng, maxLat } = focusExtent
    if (minLng == null || minLat == null || maxLng == null || maxLat == null) {
      return
    }
    map
      .getView()
      .fit(
        transformExtent(
          [minLng, minLat, maxLng, maxLat],
          DATA_PROJECTION,
          MAP_PROJECTION
        ),
        { padding: [64, 64, 64, 64], duration: 600, maxZoom: 16 }
      )
  }, [ready, focusExtent])

  // 5. 数据 -> 每图层一个矢量图层
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !data) return

    for (const [layerId, entry] of layerEntriesRef.current) {
      if (!visibleLayerIds.includes(layerId)) {
        map.removeLayer(entry.layer)
        layerEntriesRef.current.delete(layerId)
      }
    }

    for (const layer of layers) {
      if (!visibleLayerIds.includes(layer.id)) continue
      let entry = layerEntriesRef.current.get(layer.id)
      if (!entry) {
        const source = new VectorSource()
        const vectorLayer = new VectorLayer({
          source,
          style: layerStyle(colorOf(layer.layerType)),
          declutter: false,
        })
        vectorLayer.set('gisLayerId', layer.id)
        map.addLayer(vectorLayer)
        entry = { source, layer: vectorLayer }
        layerEntriesRef.current.set(layer.id, entry)
      }
      entry.source.clear()
      const rows = data[String(layer.id)] ?? []
      const features: Feature<Geometry>[] = []
      for (const row of rows) {
        const feature = toOlFeature(row)
        if (feature) features.push(feature)
      }
      entry.source.addFeatures(features)
    }
    // 数据刷新后旧的选中要素已失效
    selectRef.current?.getFeatures().clear()
  }, [data, layers, visibleLayerIds, ready])

  // 6. 选择 / 修改 / 绘制 交互（跟随编辑图层与绘制模式重建）
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const entry =
      activeLayerId != null
        ? layerEntriesRef.current.get(activeLayerId)
        : undefined
    if (!entry) return

    const select = new Select({
      layers: [entry.layer],
      condition: click,
      style: SELECT_STYLE,
    })
    selectRef.current = select
    const handleSelect = () => {
      const raw = select.getFeatures().item(0)?.get('__payload')
      callbacksRef.current.onFeatureSelect?.(
        raw ? (JSON.parse(String(raw)) as GisFeature) : null
      )
    }
    select.on('select', handleSelect)
    map.addInteraction(select)

    const modify = new Modify({
      source: entry.source,
      features: select.getFeatures(),
    })
    modify.on('modifyend', (event) => {
      event.features.forEach((feature) => {
        const raw = feature.get('__payload')
        if (!raw) return
        callbacksRef.current.onFeatureModify?.(
          JSON.parse(String(raw)) as GisFeature,
          writeGeometry(feature.getGeometry())
        )
      })
    })
    map.addInteraction(modify)

    let draw: Draw | null = null
    if (drawType) {
      draw = new Draw({ source: entry.source, type: drawType })
      draw.on('drawend', (event) => {
        callbacksRef.current.onDrawEnd?.(
          writeGeometry(event.feature.getGeometry())
        )
        // 绘制结束后移除临时要素，等后端返回再由视窗查询渲染真实数据
        window.setTimeout(() => entry.source.removeFeature(event.feature), 0)
      })
      map.addInteraction(draw)
    }

    return () => {
      map.removeInteraction(select)
      map.removeInteraction(modify)
      if (draw) map.removeInteraction(draw)
      if (selectRef.current === select) selectRef.current = null
    }
  }, [ready, activeLayerId, drawType])

  return (
    <>
      <div ref={containerRef} className='h-full w-full' />
      {!ready && (
        <div className='pointer-events-none absolute inset-0 flex items-center justify-center text-sm text-muted-foreground'>
          地图加载中…
        </div>
      )}
    </>
  )
}

/* ---------------- 内部工具 ---------------- */

function toOlFeature(row: GisFeature): Feature<Geometry> | null {
  const geometry =
    row.geometry ??
    (row.lng != null && row.lat != null
      ? {
          type: 'Point' as const,
          coordinates: [row.lng, row.lat] as [number, number],
        }
      : null)
  if (!geometry) return null

  const feature = geojsonFormat.readFeature(
    { type: 'Feature', geometry, properties: {} },
    { dataProjection: DATA_PROJECTION, featureProjection: MAP_PROJECTION }
  ) as Feature<Geometry>
  feature.set('__payload', JSON.stringify(row))
  feature.set('layerId', row.layerId)
  return feature
}

/** OL 几何 -> WGS84 GeoJSON 几何 */
function writeGeometry(geometry: Geometry | undefined): GeometryJson {
  return geojsonFormat.writeGeometryObject(geometry as Geometry, {
    dataProjection: DATA_PROJECTION,
    featureProjection: MAP_PROJECTION,
  }) as unknown as GeometryJson
}

function hexToRgba(hex: string, alpha: number) {
  const value = hex.replace('#', '')
  const r = parseInt(value.slice(0, 2), 16)
  const g = parseInt(value.slice(2, 4), 16)
  const b = parseInt(value.slice(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
