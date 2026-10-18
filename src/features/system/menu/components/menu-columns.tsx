import { type ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { StatusBadge, dash } from '../../shared/constants'
import { type SysMenuVo } from '../api'
import { DataTableRowActions } from './menu-row-actions'

export type FlatMenu = SysMenuVo & { _depth: number }

const MENU_TYPE_LABEL: Record<string, string> = {
  M: '目录',
  C: '菜单',
  F: '按钮',
}

function menuTypeLabel(type?: string) {
  if (!type) return '-'
  return MENU_TYPE_LABEL[type] ?? type
}

export const menuColumns: ColumnDef<FlatMenu>[] = [
  {
    accessorKey: 'menuName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='菜单名称' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-48 ps-3'>
        {`${'　'.repeat(row.original._depth)}${row.original.menuName}`}
      </LongText>
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
