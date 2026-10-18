import { type ColumnDef } from '@tanstack/react-table'
import { DataTableColumnHeader } from '@/components/data-table'
import { StatusBadge, dash } from '../../shared/constants'
import { type FlatDept } from '../api'
import { DataTableRowActions } from './dept-row-actions'

export const deptColumns: ColumnDef<FlatDept>[] = [
  {
    accessorKey: 'deptName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='部门名称' />
    ),
    cell: ({ row }) => (
      <span className='ps-3'>
        {'　'.repeat(row.original._depth)}
        {row.original.deptName}
      </span>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'orderNum',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='排序' />
    ),
    cell: ({ row }) => <div>{row.original.orderNum}</div>,
    enableSorting: false,
  },
  {
    id: 'leaderName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='负责人' />
    ),
    cell: ({ row }) => <span>{dash(row.original.leaderName)}</span>,
    enableSorting: false,
  },
  {
    accessorKey: 'phone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='联系电话' />
    ),
    cell: ({ row }) => <div>{dash(row.original.phone)}</div>,
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
