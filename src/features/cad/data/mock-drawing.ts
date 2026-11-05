import { CAD_DEFAULT_CENTER, DEFAULT_CAD_DRAW_SIZE_METERS } from '../config'
import type { CadBoundary, CadElement } from '../types'
import { boundsToBoundary, createBoundsFromCenter } from '../viewport'

const { width: WIDTH_M, height: HEIGHT_M } = DEFAULT_CAD_DRAW_SIZE_METERS

const BOUNDS = createBoundsFromCenter(
  CAD_DEFAULT_CENTER,
  DEFAULT_CAD_DRAW_SIZE_METERS.width,
  DEFAULT_CAD_DRAW_SIZE_METERS.height
)
const SOUTH_WEST = BOUNDS.getSouthWest()
const NORTH_EAST = BOUNDS.getNorthEast()

/** 图纸局部坐标（米，原点在图纸左下角）→ 经纬度 */
function toLatLng(mx: number, my: number) {
  return {
    lng: SOUTH_WEST.lng + (mx / WIDTH_M) * (NORTH_EAST.lng - SOUTH_WEST.lng),
    lat: SOUTH_WEST.lat + (my / HEIGHT_M) * (NORTH_EAST.lat - SOUTH_WEST.lat),
  }
}

function polygon(points: Array<[number, number]>) {
  return points.map(([mx, my]) => toLatLng(mx, my))
}

/** 图纸边界（与源项目 booundy 元组一致） */
export const MOCK_BOUNDARY: CadBoundary = boundsToBoundary(BOUNDS, 18, 12)

const BLUEPRINT_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="420" height="297" viewBox="0 0 420 297">
  <defs>
    <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
      <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(56,189,248,0.12)" stroke-width="0.4"/>
    </pattern>
  </defs>
  <rect width="420" height="297" fill="#0d1a24"/>
  <rect x="16" y="16" width="388" height="265" fill="url(#grid)"/>
  <rect x="8" y="8" width="404" height="281" fill="none" stroke="#38bdf8" stroke-width="1.6"/>
  <rect x="16" y="16" width="388" height="265" fill="none" stroke="#7dd3fc" stroke-width="0.8"/>

  <g stroke="#7dd3fc" stroke-width="1.2" fill="rgba(56,189,248,0.07)">
    <rect x="30" y="40" width="170" height="140"/>
    <rect x="210" y="40" width="90" height="70"/>
    <rect x="210" y="120" width="90" height="60"/>
    <rect x="30" y="200" width="350" height="24"/>
  </g>
  <g fill="#cbd5e1" font-family="'Microsoft YaHei',sans-serif" font-size="9">
    <text x="96" y="112">主机房</text>
    <text x="232" y="78">配电室</text>
    <text x="232" y="152">办公区</text>
    <text x="196" y="216">走廊</text>
  </g>

  <g stroke="#7dd3fc" stroke-width="0.8" fill="none">
    <rect x="250" y="235" width="154" height="46"/>
    <path d="M250 251 L404 251 M250 266 L404 266 M330 235 L330 281"/>
  </g>
  <g fill="#cbd5e1" font-family="'Microsoft YaHei',sans-serif" font-size="7">
    <text x="256" y="246">综合机房平面图</text>
    <text x="256" y="261">比例 1:100</text>
    <text x="256" y="276">图号 CAD-001</text>
    <text x="336" y="246">设计</text>
    <text x="336" y="261">审核</text>
    <text x="336" y="276">日期 2026-11-05</text>
  </g>
</svg>
`

export const MOCK_BASE_MAP_URL = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  BLUEPRINT_SVG
)}`

export const MOCK_ELEMENTS: CadElement[] = [
  {
    id: 'mock-polygon-1',
    theName: '主机房区域',
    drawType: '面',
    ...toLatLng(3, 11.7),
    positions: polygon([
      [3, 11.7],
      [20, 11.7],
      [20, 25.7],
      [3, 25.7],
    ]),
    eleState: '新建',
    drawPara: { weight: 2 },
  },
  {
    id: 'mock-polygon-2',
    theName: '配电室区域',
    drawType: '面',
    ...toLatLng(21, 18.7),
    positions: polygon([
      [21, 18.7],
      [30, 18.7],
      [30, 25.7],
      [21, 25.7],
    ]),
    eleState: '现有',
    drawPara: {},
  },
  {
    id: 'mock-line-1',
    theName: '主干光缆',
    drawType: '线',
    ...toLatLng(3, 7.7),
    positions: polygon([
      [3, 7.7],
      [12, 7.7],
      [12, 13],
      [20, 13],
      [20, 24],
    ]),
    eleState: '变量',
    drawPara: { weight: 2 },
  },
  {
    id: 'mock-point-1',
    theName: '基站 A1',
    drawType: '点',
    ...toLatLng(6, 23),
    eleState: '新建',
    size: { width: 16, height: 16 },
  },
  {
    id: 'mock-point-2',
    theName: '基站 A2',
    drawType: '点',
    ...toLatLng(13, 23),
    eleState: '利旧',
    size: { width: 16, height: 16 },
  },
  {
    id: 'mock-point-3',
    theName: '光交箱 A3',
    drawType: '点',
    ...toLatLng(26, 22),
    eleState: '现有',
    size: { width: 16, height: 16 },
    drawPara: { rotate: 15 },
  },
  {
    id: 'mock-point-4',
    theName: '光交箱 A4',
    drawType: '点',
    ...toLatLng(26, 14),
    eleState: '新建',
    size: { width: 16, height: 16 },
  },
  {
    id: 'mock-label-1',
    theName: '主机房',
    drawType: '标注点',
    ...toLatLng(11.5, 19),
    drawPara: { fontSize: 12, color: '#7dd3fc' },
  },
  {
    id: 'mock-label-2',
    theName: '光缆-01',
    drawType: '标注点',
    ...toLatLng(7.5, 6.6),
    drawPara: { fontSize: 11, color: '#fbbf24' },
  },
]
