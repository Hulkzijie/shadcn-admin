import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import { useCadState } from '../store'
import { boundaryToBounds } from '../viewport'
import { CadDraftLayer } from './cad-draft-layer'
import { CadElementLayer } from './cad-element-layer'
import { CadImageOverlay } from './cad-image-overlay'
import { CadMapContainer } from './cad-map-container'
import { CadMapInteraction } from './cad-map-interaction'
import { CadScaleSync } from './cad-scale-sync'
import { CadToolbar } from './cad-toolbar'
import { CadViewportLocator } from './cad-viewport-locator'

/** CAD 画布内核：底图 + 图元 + 草稿 + 缩放同步 + 工具栏 */
export function CadCanvas({ className }: { className?: string }) {
  const boundary = useCadState((state) => state.boundary)

  const bounds = useMemo(
    () => (boundary ? boundaryToBounds(boundary) : null),
    [boundary]
  )

  if (!boundary || !bounds) return null

  return (
    <div className={cn('relative h-full w-full', className)}>
      <CadMapContainer className='h-full w-full' bounds={bounds}>
        <CadImageOverlay boundary={boundary} />
        <CadElementLayer />
        <CadDraftLayer />
        <CadScaleSync />
        <CadViewportLocator boundary={boundary} />
        <CadMapInteraction />
      </CadMapContainer>
      <CadToolbar />
    </div>
  )
}
