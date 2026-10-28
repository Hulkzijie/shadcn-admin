import { type ColumnDef } from '@tanstack/react-table'
import { ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { StatusBadge, dash } from '../../shared/constants'
import { type SysMenuVo } from '../api'
import { DataTableRowActions } from './menu-row-actions'

/** 菜单树节点，children 由后端直接返回 */
export type MenuRow = SysMenuVo

const MENU_TYPE_LABEL: Record<string, string> = {
  M: '目录',
  C: '菜单',
  F: '按钮',
}

function menuTypeLabel(type?: string) {
  if (!type) return '-'
  return MENU_TYPE_LABEL[type] ?? type
}

export const menuColumns: ColumnDef<MenuRow>[] = [
  {
    accessorKey: 'menuName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='菜单名称' />
    ),
    cell: ({ row }) => (
      <div
        className='flex items-center gap-1'
        style={{ paddingInlineStart: `${row.depth * 1.25}rem` }}
      >
        {row.getCanExpand() ? (
          <Button
            variant='ghost'
            size='icon'
            className='size-6 shrink-0'
            onClick={row.getToggleExpandedHandler()}
          >
            <ChevronRight
              className={cn(
                'size-4 transition-transform',
                row.getIsExpanded() && 'rotate-90'
              )}
            />
            <span className='sr-only'>
              {row.getIsExpanded() ? '收起' : '展开'}
            </span>
          </Button>
        ) : (
          <span className='size-6 shrink-0' />
        )}
        <LongText className='max-w-48'>{row.original.menuName}</LongText>
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'orderNum',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='排序' />
    ),
    cell: ({ row }) => <div>{dash(row.original.orderNum)}</div>,
    enableSorting: false,
  },
  {
    id: 'icon',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='图标' />
    ),
    cell: ({ row }) => <div>{dash(row.original.icon)}</div>,
    enableSorting: false,
  },
  {
    accessorKey: 'path',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='路由地址' />
    ),
    cell: ({ row }) => <div>{dash(row.original.path)}</div>,
    enableSorting: false,
  },
  {
    accessorKey: 'perms',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='权限标识' />
    ),
    cell: ({ row }) => <div>{dash(row.original.perms)}</div>,
    enableSorting: false,
  },
  {
    id: 'menuType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='菜单类型' />
    ),
    cell: ({ row }) => <div>{menuTypeLabel(row.original.menuType)}</div>,
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
