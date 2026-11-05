import { MapPin, MousePointer2, Pentagon, Spline, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DrawKind } from './editor-map'

interface DrawToolbarProps {
  drawType: DrawKind | null
  /** 当前图层允许的绘制类型 */
  options: DrawKind[]
  onChange: (type: DrawKind | null) => void
  canDelete: boolean
  onDelete: () => void
}

const KIND_META: Record<DrawKind, { label: string; icon: typeof MapPin }> = {
  Point: { label: '点', icon: MapPin },
  LineString: { label: '线', icon: Spline },
  Polygon: { label: '面', icon: Pentagon },
}

export function DrawToolbar({
  drawType,
  options,
  onChange,
  canDelete,
  onDelete,
}: DrawToolbarProps) {
  return (
    <div className='space-y-3'>
      <p className='text-sm font-medium'>绘制工具</p>

      <div className='flex flex-wrap gap-1.5'>
        <Button
          variant={drawType == null ? 'secondary' : 'outline'}
          size='sm'
          onClick={() => onChange(null)}
        >
          <MousePointer2 className='size-3.5' />
          选择
        </Button>
        {options.map((kind) => {
          const { label, icon: Icon } = KIND_META[kind]
          return (
            <Button
              key={kind}
              variant={drawType === kind ? 'secondary' : 'outline'}
              size='sm'
              onClick={() => onChange(drawType === kind ? null : kind)}
            >
              <Icon className='size-3.5' />
              {label}
            </Button>
          )
        })}
      </div>

      <Button
        variant='destructive'
        size='sm'
        className='w-full'
        disabled={!canDelete}
        onClick={onDelete}
      >
        <Trash2 className='size-3.5' />
        删除选中要素
      </Button>

      <p className='text-xs text-muted-foreground'>
        选择要素后可拖动顶点调整；绘制完成后自动保存到当前图层。
      </p>
    </div>
  )
}
