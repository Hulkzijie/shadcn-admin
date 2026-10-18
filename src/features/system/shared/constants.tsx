import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'

/** 启用/停用状态（RuoYi 约定 0=正常 1=停用） */
export const STATUS_OPTIONS = [
  { label: '正常', value: '0' },
  { label: '停用', value: '1' },
] as const

export function statusLabel(status?: string) {
  if (status === '0') return '正常'
  if (status === '1') return '停用'
  return '-'
}

export function StatusBadge({ status }: { status?: string }) {
  const enabled = status === '0'
  return (
    <Badge
      variant='outline'
      className={cn(
        enabled
          ? 'border-teal-200 bg-teal-100/30 text-teal-900 dark:text-teal-200'
          : 'border-neutral-300 bg-neutral-300/40 text-neutral-600 dark:text-neutral-300'
      )}
    >
      {statusLabel(status)}
    </Badge>
  )
}

/** 通用“-”占位渲染 */
export function dash(value?: string | number | null) {
  if (value === undefined || value === null || value === '') return '-'
  return String(value)
}
