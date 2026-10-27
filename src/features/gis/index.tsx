import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { handleServerError } from '@/lib/handle-server-error'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { getLayerExtent } from './api'
import { FeatureDetail } from './components/feature-detail'
import { GisMap } from './components/gis-map'
import { LayerTree } from './components/layer-tree'
import {
  useSaveUserView,
  useUserView,
  useVisibleLayers,
  useWindowFeatures,
} from './queries'
import type { GisFeature, LayerExtent, Viewport } from './types'

export function GisPage() {
  const { data: layers = [], isPending, isError, refetch } = useVisibleLayers()
  const userViewQuery = useUserView()
  const { mutate: saveView } = useSaveUserView()
  // null 表示用户还没手动勾选，按记忆值（无记忆则全选）推导
  const [selectedIds, setSelectedIds] = useState<number[] | null>(null)
  const [viewport, setViewport] = useState<Viewport | null>(null)
  const [activeFeature, setActiveFeature] = useState<GisFeature | null>(null)
  const [focusExtent, setFocusExtent] = useState<LayerExtent | null>(null)
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

  const { data, isFetching } = useWindowFeatures(viewport, visibleIds)

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
            <p className='text-muted-foreground'>图层浏览、要素查询与定位。</p>
          </div>
          {isFetching && (
            <span className='text-xs text-muted-foreground'>加载中…</span>
          )}
        </div>

        <div className='grid flex-1 grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]'>
          <Card className='max-h-[72vh] gap-0 overflow-auto p-3'>
            {isError ? (
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
            <GisMap
              layers={layers}
              visibleLayerIds={visibleIds}
              data={data}
              initialView={initialView}
              focusExtent={focusExtent}
              onViewportChange={handleViewportChange}
              onFeatureClick={setActiveFeature}
            />
          </Card>
        </div>
      </Main>

      <FeatureDetail
        feature={activeFeature}
        layers={layers}
        onClose={() => setActiveFeature(null)}
      />
    </>
  )
}
