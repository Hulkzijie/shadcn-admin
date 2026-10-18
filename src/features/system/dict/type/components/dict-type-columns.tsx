import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { dash } from '../../../shared/constants'
import { type SysDictTypeVo } from '../../api'
import { DataTableRowActions } from './dict-type-row-actions'

export const dictTypeColumns: ColumnDef<SysDictTypeVo>[] = [
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
    accessorKey: 'dictName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='字典名称' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 ps-3'>{row.getValue('dictName')}</LongText>
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'dictType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='字典类型' />
    ),
    cell: ({ row }) => (
      <code className='rounded bg-muted px-1.5 py-0.5 font-mono text-xs'>
        {row.getValue('dictType')}
      </code>
    ),
  },
  {
    accessorKey: 'remark',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='备注' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-60'>{row.getValue('remark')}</LongText>
    ),
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
