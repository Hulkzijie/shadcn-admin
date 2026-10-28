import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { StatusBadge, dash } from '../../shared/constants'
import { type SysTenantVo } from '../api'
import { DataTableRowActions } from './tenant-row-actions'

export const tenantColumns: ColumnDef<SysTenantVo>[] = [
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
    accessorKey: 'companyName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='企业名称' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 ps-3'>
        {row.getValue('companyName')}
      </LongText>
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'contactUserName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='联系人' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36'>
        {row.getValue('contactUserName')}
      </LongText>
    ),
  },
  {
    accessorKey: 'contactPhone',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='联系电话' />
    ),
    cell: ({ row }) => <div>{dash(row.getValue('contactPhone'))}</div>,
  },
  {
    accessorKey: 'tenantId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='租户编号' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36'>{row.getValue('tenantId')}</LongText>
    ),
  },
  {
    accessorKey: 'accountCount',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='用户数' />
    ),
    cell: ({ row }) => {
      const count = row.original.accountCount
      return <div>{count === -1 ? '不限' : dash(count)}</div>
    },
    enableSorting: false,
  },
  {
    accessorKey: 'expireTime',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='过期时间' />
    ),
    cell: ({ row }) => <div>{dash(row.getValue('expireTime'))}</div>,
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
    id: 'actions',
    cell: DataTableRowActions,
  },
]
