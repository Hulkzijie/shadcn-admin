import L from 'leaflet'
import type { CadBoundary, CadElement } from './types'

const METERS_PER_DEGREE_LAT = 111320
const MIN_VIEWPORT_PADDING_PX = 24
const CAD_VIEWPORT_OCCUPANCY = { width: 0.9, height: 0.9 } as const

const getMetersPerDegreeLng = (lat: number) => {
  const value = METERS_PER_DEGREE_LAT * Math.cos((lat * Math.PI) / 180)
  return Math.abs(value) > Number.EPSILON ? Math.abs(value) : METERS_PER_DEGREE_LAT
}

/** 以中心点 + 实际米数推算出图纸的地理边界 */
export function createBoundsFromCenter(
  center: L.LatLngExpression,
  widthMeters: number,
  heightMeters: number
): L.LatLngBounds {
  const latLng = L.latLng(center)
  const latOffset = heightMeters / 2 / METERS_PER_DEGREE_LAT
  const lngOffset = widthMeters / 2 / getMetersPerDegreeLng(latLng.lat)
  return L.latLngBounds(
    [latLng.lat - latOffset, latLng.lng - lngOffset],
    [latLng.lat + latOffset, latLng.lng + lngOffset]
  )
}

export function boundaryToBounds(boundary: CadBoundary): L.LatLngBounds {
  const [minLng, maxLng, minLat, maxLat] = boundary
  return L.latLngBounds([minLat, minLng], [maxLat, maxLng])
}

export function boundsToBoundary(
  bounds: L.LatLngBounds,
  baseZoom?: number,
  fontSize?: number
): CadBoundary {
  const sw = bounds.getSouthWest()
  const ne = bounds.getNorthEast()
  return [sw.lng, ne.lng, sw.lat, ne.lat, baseZoom, fontSize]
}

/** 图元集合的地理包围盒 */
export function getBoundsFromElements(
  elements: CadElement[]
): L.LatLngBounds | null {
  const latLngs: L.LatLngExpression[] = []
  elements.forEach((element) => {
    if (element.positions?.length) {
      element.positions.forEach((item) => latLngs.push([item.lat, item.lng]))
    } else if (Number.isFinite(element.lat) && Number.isFinite(element.lng)) {
      latLngs.push([element.lat, element.lng])
    }
  })
  return latLngs.length ? L.latLngBounds(latLngs) : null
}

export function getCadViewportPadding(map: L.Map): L.Point {
  const container = map.getContainer?.()
  const width = container?.clientWidth || 0
  const height = container?.clientHeight || 0
  const paddingX = Math.max(
    MIN_VIEWPORT_PADDING_PX,
    (width * (1 - CAD_VIEWPORT_OCCUPANCY.width)) / 2
  )
  const paddingY = Math.max(
    MIN_VIEWPORT_PADDING_PX,
    (height * (1 - CAD_VIEWPORT_OCCUPANCY.height)) / 2
  )
  return L.point(paddingX, paddingY)
}

export function getCadViewportFitZoom(
  map: L.Map,
  bounds: L.LatLngBounds
): number {
  const fitZoom = map.getBoundsZoom(bounds, false, getCadViewportPadding(map))
  return Number.isFinite(fitZoom) ? fitZoom : map.getZoom()
}

/**
 * 图元随缩放同步放大/缩小：以图纸适配缩放为基准，
 * scale = 2^(当前 zoom - 基准 zoom)，通过 CSS 变量驱动。
 */
export function applyScaleVars(map: L.Map, baseZoom: number): void {
  const scale = Math.pow(2, map.getZoom() - baseZoom)
  const style = document.documentElement.style
  style.setProperty('--leaflet-marker-scale', String(scale))
  style.setProperty('--leaflet-limit-marker-scale', String(scale))
  style.setProperty('--leaflet-line-width', String(scale * 2))
}
