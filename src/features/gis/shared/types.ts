/** 与后端 GisLayerVo 对齐 */
export interface GisLayerVo {
  id: number
  layerName: string
  /** 要素存储方式：UNIFIED（统一表）/ LEGACY（复用原表） */
  storageType?: string
  /** LEGACY 图层对应的物理表名 */
  tableName?: string
  layerType: 'POINT' | 'LINE' | 'POLYGON' | 'HEAT' | 'MIX'
  groupId?: number
  layerOrder?: number
  zoomLimit?: number
  labelShowLevel?: number
  iconPara?: string
  drawMode?: string
  drawType?: string
  renderType?: string
  renderParam?: Record<string, unknown>
  clusterLevel?: number
  property?: LayerProperty[]
  bodyFieldConfig?: Record<string, unknown>
  ignoreFilterKeys?: string
  /** 共享范围：111001 私有 / 111002 部门 / 111003 公开 / 111004 角色 */
  shareType?: string
  shareId?: number
  orgId?: number
  editable?: number
  isSystem?: string
  status?: string
  remark?: string
  /** ---------------- LEGACY 原表映射配置 ---------------- */
  legacyIdColumn?: string
  legacyNameColumn?: string
  legacyLngColumn?: string
  legacyLatColumn?: string
  legacyGeometryColumn?: string
  legacyPropsColumns?: string
  legacyStatusColumn?: string
  legacyStatusValue?: string
  legacyTenantColumn?: string
  legacyFilter?: string
  legacyWritable?: number
  legacyIdGenerated?: number
}

/** 字段映射：[{ en, col, detail, type, search }] */
export interface LayerProperty {
  /** 前端字段名 */
  en: string
  /** 数据库列名 */
  col: string
  /** 详情面板中展示 */
  detail?: boolean
  /** 数据类型：string/number/datetime */
  type?: string
  /** 是否可作为查询条件 */
  search?: boolean
}

/** GeoJSON Geometry（只用到这三种） */
export type Geometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'LineString'; coordinates: [number, number][] }
  | { type: 'Polygon'; coordinates: [number, number][][] }

/** 视窗查询返回的要素 */
export interface GisFeature {
  id: number | string
  layerId: number
  theName?: string
  geometryType?: string
  geometry?: Geometry
  props?: Record<string, unknown>
  lng?: number
  lat?: number
  /** 聚合点才有 */
  count?: number
  cluster?: boolean
}

export interface BBox {
  minLng: number
  minLat: number
  maxLng: number
  maxLat: number
}

/** 地图视窗：外接矩形 + 当前缩放级别 */
export interface Viewport extends BBox {
  zoom: number
}

/** 属性过滤条件：eq / like / in / between / ge / le */
export interface FieldCondition {
  field: string
  type: 'eq' | 'like' | 'in' | 'between' | 'ge' | 'le'
  value: string[]
}

export interface WindowQuery extends BBox {
  layerIds: number[]
  zoom?: number
  clusterLevel?: number
  /** 每图层取要素上限，缺省 3000 */
  limit?: number
  /** layerId -> 属性过滤条件 */
  extraCond?: Record<number, FieldCondition[]>
}

export interface FeatureSavePayload {
  id?: number
  layerId: number
  theName?: string
  geometry: Geometry
  props?: Record<string, unknown>
}

/** 图层新增/修改入参（后端 GisLayerBo，JSON 字段仍以字符串传递） */
export interface LayerSavePayload {
  id?: number
  layerName: string
  layerType?: string
  groupId?: number
  layerOrder?: number
  zoomLimit?: number
  labelShowLevel?: number
  iconPara?: string
  drawMode?: string
  drawType?: string
  renderType?: string
  renderParam?: string
  clusterLevel?: number
  property?: string
  bodyFieldConfig?: string
  ignoreFilterKeys?: string
  shareType?: string
  shareId?: number
  orgId?: number
  editable?: number
  status?: string
  remark?: string
  storageType?: string
  tableName?: string
  legacyIdColumn?: string
  legacyNameColumn?: string
  legacyLngColumn?: string
  legacyLatColumn?: string
  legacyGeometryColumn?: string
  legacyPropsColumns?: string
  legacyStatusColumn?: string
  legacyStatusValue?: string
  legacyTenantColumn?: string
  legacyFilter?: string
  legacyWritable?: number
  legacyIdGenerated?: number
}

export interface LayerExtent {
  minLng?: number
  minLat?: number
  maxLng?: number
  maxLat?: number
}

/** 用户视图记忆（后端 GisUserViewVo），首次进入为 null */
export interface GisUserView {
  userId: number
  centerLng?: number | null
  centerLat?: number | null
  zoom?: number | null
  visibleLayerIds?: number[]
}

/** 保存视图记忆入参（后端 GisUserViewBo） */
export interface GisUserViewPayload {
  centerLng: number
  centerLat: number
  zoom: number
  visibleLayerIds: number[]
}
