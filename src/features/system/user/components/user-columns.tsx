import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { StatusBadge, dash } from '../../shared/constants'
import { type SysUserVo } from '../api'
import { DataTableRowActions } from './user-row-actions'

export const userColumns: ColumnDef<SysUserVo>[] = [
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
    accessorKey: 'userName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='用户名' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 ps-3'>{row.getValue('userName')}</LongText>
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'nickName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='昵称' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36'>{row.getValue('nickName')}</LongText>
    ),
  },
  {
    id: 'deptName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='部门' />
    ),
    cell: ({ row }) => <span>{dash(row.original.deptName)}</span>,
    enableSorting: false,
  },
  {
    accessorKey: 'phonenumber',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='手机号' />
    ),
    cell: ({ row }) => <div>{dash(row.getValue('phonenumber'))}</div>,
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
    id: 'roles',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='角色' />
    ),
    cell: ({ row }) => {
      const roles = row.original.roles ?? []
      if (!roles.length) return <span>-</span>
      return (
        <div className='flex flex-wrap gap-1'>
          {roles.map((role) => (
            <span key={role.roleId} className='text-sm'>
              {role.roleName}
            </span>
          ))}
        </div>
      )
    },
    enableSorting: false,
    enableHiding: false,
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
