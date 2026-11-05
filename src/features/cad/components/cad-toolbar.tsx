import {
  Check,
  MapPin,
  MousePointer2,
  Pentagon,
  Spline,
  Trash2,
  Type,
  Undo2,
  X,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCadState, useCadStoreApi } from '../store'
import type { CadTool } from '../types'

const TOOL_META: Array<{ tool: CadTool; label: string; icon: typeof MapPin }> = [
  { tool: 'select', label: '选择', icon: MousePointer2 },
  { tool: 'point', label: '点', icon: MapPin },
  { tool: 'line', label: '线', icon: Spline },
  { tool: 'polygon', label: '面', icon: Pentagon },
  { tool: 'label', label: '标注', icon: Type },
]

const TOOL_HINT: Record<CadTool, string> = {
  select: '单击图元选中，拖动可移动位置',
  point: '单击图纸放置点图元',
  line: '单击连续采点，Enter 或「完成」生成线',
  polygon: '单击连续采点，Enter 或「完成」生成面',
  label: '单击图纸放置标注文字',
}

/** 画布浮动工具栏：工具切换 + 草稿提交 + 删除选中 */
export function CadToolbar() {
  const tool = useCadState((state) => state.tool)
  const draft = useCadState((state) => state.draft)
  const selectedIds = useCadState((state) => state.selectedIds)
  const elementCount = useCadState((state) => state.elementList.length)
  const store = useCadStoreApi()

  const minPoints = draft?.drawType === '面' ? 3 : 2
  const canCommit = !!draft && draft.positions.length >= minPoints

  const switchTool = (next: CadTool) => {
    store.getState().update({ tool: next, draft: null })
  }

  const undoDraftPoint = () => {
    store.getState().update((state) => {
      if (!state.draft) return {}
      const positions = state.draft.positions.slice(0, -1)
      return {
        draft: positions.length ? { ...state.draft, positions } : null,
      }
    })
  }

  return (
    <div className='absolute top-3 left-3 z-[1000] flex flex-col gap-2 rounded-lg border bg-background/95 p-2 shadow-md backdrop-blur'>
      <div className='flex flex-wrap gap-1'>
        {TOOL_META.map(({ tool: value, label, icon: Icon }) => (
          <Button
            key={value}
            variant={tool === value ? 'secondary' : 'outline'}
            size='sm'
            onClick={() => switchTool(value)}
          >
            <Icon className='size-3.5' />
            {label}
          </Button>
        ))}
      </div>

      {draft ? (
        <div className='flex flex-wrap items-center gap-1 border-t pt-2'>
          <span className='mr-auto text-xs text-muted-foreground'>
            {draft.drawType} · {draft.positions.length} 点
          </span>
          <Button
            variant='outline'
            size='sm'
            disabled={draft.positions.length === 0}
            onClick={undoDraftPoint}
          >
            <Undo2 className='size-3.5' />
            撤销
          </Button>
          <Button
            variant='secondary'
            size='sm'
            disabled={!canCommit}
            onClick={() => store.getState().commitDraft()}
          >
            <Check className='size-3.5' />
            完成
          </Button>
          <Button
            variant='outline'
            size='sm'
            onClick={() => store.getState().clearDraft()}
          >
            <X className='size-3.5' />
            取消
          </Button>
        </div>
      ) : null}

      <div className='flex items-center justify-between gap-2 border-t pt-2'>
        <span className='text-xs text-muted-foreground'>
          {elementCount} 个图元
        </span>
        <Button
          variant='destructive'
          size='sm'
          disabled={selectedIds.length === 0}
          onClick={() => store.getState().removeElements(selectedIds)}
        >
          <Trash2 className='size-3.5' />
          删除选中
        </Button>
      </div>

      <p className='max-w-[220px] text-[11px] leading-snug text-muted-foreground'>
        {TOOL_HINT[tool]}
      </p>
    </div>
  )
}
