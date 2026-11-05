import {
  lazy,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { AlertCircle, PenLine, RefreshCw, Route } from 'lucide-react'
import { toast } from 'sonner'
import { handleServerError } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { FeatureDetail } from './components/feature-detail'
import { LayerTree } from './components/layer-tree'
import { DrawToolbar } from './editor/draw-toolbar'
import type { DrawKind } from './editor/editor-map'
import { getLayerExtent } from './shared/api'
import {
  useDeleteFeature,
  useSaveFeature,
  useSaveUserView,
  useUserView,
  useVisibleLayers,
  useWindowFeatures,
} from './shared/queries'
import type {
  Geometry,
  GisFeature,
  LayerExtent,
  Viewport,
} from './shared/types'

type PageMode = 'preview' | 'edit'

const ALL_DRAW_KINDS: DrawKind[] = ['Point', 'LineString', 'Polygon']

const DRAW_KINDS_BY_LAYER_TYPE: Record<string, DrawKind[]> = {
  POINT: ['Point'],
  LINE: ['LineString'],
  POLYGON: ['Polygon'],
}

// 两套地图库按模式懒加载：预览页不加载 OpenLayers，编辑页不加载 MapLibre
const PreviewMap = lazy(() =>
  import('./preview/preview-map').then((m) => ({ default: m.PreviewMap }))
)
const EditorMap = lazy(() =>
  import('./editor/editor-map').then((m) => ({ default: m.EditorMap }))
)

export function GisPage() {
  const { data: layers = [], isPending, isError, refetch } = useVisibleLayers()
  const userViewQuery = useUserView()
  const { mutate: saveView } = useSaveUserView()
  const { mutate: saveFeature } = useSaveFeature()
  const { mutate: deleteFeature } = useDeleteFeature()

  const [mode, setMode] = useState<PageMode>('preview')
  // null 表示用户还没手动勾选，按记忆值（无记忆则全选）推导
  const [selectedIds, setSelectedIds] = useState<number[] | null>(null)
  const [viewport, setViewport] = useState<Viewport | null>(null)
  const [activeFeature, setActiveFeature] = useState<GisFeature | null>(null)
  const [focusExtent, setFocusExtent] = useState<LayerExtent | null>(null)
  const [editLayerId, setEditLayerId] = useState<number | null>(null)
  const [drawType, setDrawType] = useState<DrawKind | null>(null)
  const timerRef = useRef<number | null>(null)

  // 勾选状态 = 用户手动选择 ?? 记忆中的勾选（记忆的图层已被删除时回到全选）
  const visibleIds = useMemo(() => {
    if (selectedIds) return selectedIds
    const all = layers.map((layer) => layer.id)
    const remembered = userViewQuery.data?.visibleLayerIds
    if (!remembered) return all
    const valid = remembered.filter((id) => all.includes(id))
    return remembered.length > 0 && valid.length === 0 ? all : valid
  }, [selectedIds, layers, userViewQuery.data])

  // 编辑模式只处理 editable = 1 的图层
  const editableLayers = useMemo(
    () => layers.filter((layer) => layer.editable === 1),
    [layers]
  )
  const editableIds = useMemo(
    () => editableLayers.map((layer) => layer.id),
    [editableLayers]
  )

  // 选中的编辑图层失效时自动回落到第一个可编辑图层
  const activeLayerId = useMemo(() => {
    if (editLayerId != null && editableIds.includes(editLayerId)) {
      return editLayerId
    }
    return editableIds[0] ?? null
  }, [editLayerId, editableIds])

  const activeLayer =
    editableLayers.find((layer) => layer.id === activeLayerId) ?? null
  const drawOptions = activeLayer
    ? (DRAW_KINDS_BY_LAYER_TYPE[activeLayer.layerType] ?? ALL_DRAW_KINDS)
    : []
  const currentDrawType =
    drawType && drawOptions.includes(drawType) ? drawType : null

  // 记忆的视窗中心（首次使用为 null，由地图用默认值）
  const initialView = useMemo(() => {
    const view = userViewQuery.data
    if (view?.centerLng == null || view?.centerLat == null) return null
    return { lng: view.centerLng, lat: view.centerLat, zoom: view.zoom }
  }, [userViewQuery.data])

  // 地图移动防抖 300ms，避免拖动时请求风暴
  const handleViewportChange = useCallback((next: Viewport) => {
    if (timerRef.current) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => setViewport(next), 300)
  }, [])

  // 视窗或勾选变化后静默回写服务端（viewport 已防抖；记忆未就绪时不写，避免覆盖）
  useEffect(() => {
    if (!viewport || !layers.length || userViewQuery.isPending) return
    saveView({
      centerLng: (viewport.minLng + viewport.maxLng) / 2,
      centerLat: (viewport.minLat + viewport.maxLat) / 2,
      zoom: viewport.zoom,
      visibleLayerIds: visibleIds,
    })
  }, [viewport, visibleIds, saveView, layers.length, userViewQuery.isPending])

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current)
    },
    []
  )

  const handleLocate = async (layerId: number) => {
    try {
      const extent = await getLayerExtent(layerId)
      setFocusExtent({ ...extent })
    } catch (error) {
      handleServerError(error)
    }
  }

  const queryLayerIds = useMemo(
    () => (mode === 'edit' ? editableIds : visibleIds),
    [mode, editableIds, visibleIds]
  )
  const { data, isFetching } = useWindowFeatures(viewport, queryLayerIds)

  // 绘制完成 -> 新增要素
  const handleDrawEnd = (geometry: Geometry) => {
    if (activeLayerId == null) {
      toast.error('请先选择可编辑图层')
      return
    }
    saveFeature({ layerId: activeLayerId, geometry })
  }

  // 拖动顶点 -> 修改要素
  const handleFeatureModify = (feature: GisFeature, geometry: Geometry) => {
    const id = typeof feature.id === 'number' ? feature.id : Number(feature.id)
    if (!Number.isFinite(id)) {
      toast.error('该要素不支持修改')
      return
    }
    saveFeature({
      id,
      layerId: feature.layerId,
      theName: feature.theName,
      props: feature.props,
      geometry,
    })
  }

  const handleDeleteFeature = () => {
    if (!activeFeature) return
    deleteFeature(
      { id: activeFeature.id, layerId: activeFeature.layerId },
      { onSuccess: () => setActiveFeature(null) }
    )
  }

  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>GIS 地图</h2>
            <p className='text-muted-foreground'>
              {mode === 'edit'
                ? '绘制、修改与删除业务要素。'
                : '图层浏览、要素查询与定位。'}
            </p>
          </div>
          <div className='flex items-center gap-3'>
            {isFetching && (
              <span className='text-xs text-muted-foreground'>加载中…</span>
            )}
            <div className='flex gap-1 rounded-lg border p-1'>
              <Button
                size='sm'
                variant={mode === 'preview' ? 'secondary' : 'ghost'}
                onClick={() => setMode('preview')}
              >
                <Route className='size-3.5' />
                预览
              </Button>
              <Button
                size='sm'
                variant={mode === 'edit' ? 'secondary' : 'ghost'}
                onClick={() => setMode('edit')}
              >
                <PenLine className='size-3.5' />
                编辑
              </Button>
            </div>
          </div>
        </div>

        <div className='grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]'>
          <Card className='max-h-[72vh] gap-0 overflow-auto p-3'>
            {mode === 'edit' ? (
              <div className='space-y-5'>
                <div className='space-y-2'>
                  <p className='text-sm font-medium'>编辑图层</p>
                  {editableLayers.length === 0 ? (
                    <p className='text-sm text-muted-foreground'>
                      没有可编辑图层（editable = 1）
                    </p>
                  ) : (
                    editableLayers.map((layer) => (
                      <Button
                        key={layer.id}
                        variant={
                          activeLayerId === layer.id ? 'secondary' : 'ghost'
                        }
                        size='sm'
                        className='w-full justify-start'
                        onClick={() => {
                          setEditLayerId(layer.id)
                          setDrawType(null)
                          setActiveFeature(null)
                        }}
                      >
                        {layer.layerName}
                      </Button>
                    ))
                  )}
                </div>

                <DrawToolbar
                  drawType={currentDrawType}
                  options={drawOptions}
                  onChange={setDrawType}
                  canDelete={!!activeFeature}
                  onDelete={handleDeleteFeature}
                />
              </div>
            ) : isError ? (
              <div className='space-y-2 text-sm'>
                <p className='flex items-center gap-1.5 text-destructive'>
                  <AlertCircle className='size-4' />
                  图层接口不可用
                </p>
                <p className='text-xs text-muted-foreground'>
                  请确认后端已提供 /gis/layer/visible 接口。
                </p>
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => void refetch()}
                >
                  <RefreshCw className='size-3.5' />
                  重试
                </Button>
              </div>
            ) : isPending ? (
              <p className='text-sm text-muted-foreground'>图层加载中…</p>
            ) : layers.length === 0 ? (
              <p className='text-sm text-muted-foreground'>暂无可视图层</p>
            ) : (
              <LayerTree
                layers={layers}
                visibleIds={visibleIds}
                onChange={setSelectedIds}
                onLocate={handleLocate}
              />
            )}
          </Card>

          <Card className='relative h-[72vh] gap-0 overflow-hidden p-0'>
            <Suspense
              fallback={
                <div className='flex h-full items-center justify-center text-sm text-muted-foreground'>
                  地图加载中…
                </div>
              }
            >
              {mode === 'edit' ? (
                <EditorMap
                  layers={editableLayers}
                  visibleLayerIds={editableIds}
                  data={data}
                  initialView={initialView}
                  focusExtent={focusExtent}
                  activeLayerId={activeLayerId}
                  drawType={currentDrawType}
                  onViewportChange={handleViewportChange}
                  onFeatureSelect={setActiveFeature}
                  onDrawEnd={handleDrawEnd}
                  onFeatureModify={handleFeatureModify}
                />
              ) : (
                <PreviewMap
                  layers={layers}
                  visibleLayerIds={visibleIds}
                  data={data}
                  initialView={initialView}
                  focusExtent={focusExtent}
                  onViewportChange={handleViewportChange}
                  onFeatureClick={setActiveFeature}
                />
              )}
            </Suspense>
          </Card>
        </div>
      </Main>

      <FeatureDetail
        feature={activeFeature}
        layers={layers}
        onClose={() => setActiveFeature(null)}
        onDelete={
          mode === 'edit' && activeFeature ? handleDeleteFeature : undefined
        }
      />
    </>
  )
}
