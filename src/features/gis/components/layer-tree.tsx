import { useMemo } from 'react'
import { LocateFixed } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import type { GisLayerVo } from '../types'

interface LayerTreeProps {
  layers: GisLayerVo[]
  visibleIds: number[]
  onChange: (ids: number[]) => void
  onLocate?: (layerId: number) => void
}

export function LayerTree({
  layers,
  visibleIds,
  onChange,
  onLocate,
}: LayerTreeProps) {
  const groups = useMemo(() => {
    const map = new Map<number, GisLayerVo[]>()
    for (const layer of layers) {
      const key = layer.groupId ?? 0
      const arr = map.get(key) ?? []
      arr.push(layer)
      map.set(key, arr)
    }
    return [...map.entries()]
  }, [layers])

  const toggle = (id: number, checked: boolean) => {
    onChange(
      checked
        ? [...new Set([...visibleIds, id])]
        : visibleIds.filter((x) => x !== id)
    )
  }

  return (
    <div className='space-y-4'>
      <p className='text-sm font-medium'>图层</p>
      {groups.map(([groupId, items]) => (
        <div key={groupId} className='space-y-2'>
          <p className='text-xs text-muted-foreground'>
            分组 {groupId || '默认'}
          </p>
          {items
            .slice()
            .sort((a, b) => (a.layerOrder ?? 0) - (b.layerOrder ?? 0))
            .map((layer) => (
              <div key={layer.id} className='flex items-center gap-2'>
                <Checkbox
                  id={`layer-${layer.id}`}
                  checked={visibleIds.includes(layer.id)}
                  onCheckedChange={(v) => toggle(layer.id, v === true)}
                />
                <label
                  htmlFor={`layer-${layer.id}`}
                  className='flex-1 cursor-pointer text-sm'
                >
                  {layer.layerName}
                </label>
                <Button
                  variant='ghost'
                  size='icon'
                  className='size-7'
                  title='定位到图层'
                  onClick={() => onLocate?.(layer.id)}
                >
                  <LocateFixed className='size-4' />
                </Button>
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}
