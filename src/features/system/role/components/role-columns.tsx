import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { StatusBadge, dash } from '../../shared/constants'
import { type SysRoleVo } from '../api'
import { DataTableRowActions } from './role-row-actions'

export const roleColumns: ColumnDef<SysRoleVo>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label='Select all'
        className='translate-y-0.5'
      />
    ),
    meta: { className: cn('inset-s-0 z-10 rounded-tl-[inherit]') },
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label='Select row'
        className='translate-y-0.5'
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'roleName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='角色名称' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 ps-3'>{row.getValue('roleName')}</LongText>
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'roleKey',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='权限字符' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36'>{row.getValue('roleKey')}</LongText>
    ),
  },
  {
    accessorKey: 'roleSort',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='显示顺序' />
    ),
    cell: ({ row }) => <div>{dash(row.getValue('roleSort'))}</div>,
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='状态' />
    ),
    cell: ({ row }) => <StatusBadge status={row.original.status} />,
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    enableSorting: false,
  },
  {
    accessorKey: 'createTime',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='创建时间' />
    ),
    cell: ({ row }) => <div>{dash(row.getValue('createTime'))}</div>,
    enableSorting: false,
  },
  {
    id: 'actions',
    cell: DataTableRowActions,
  },
]
