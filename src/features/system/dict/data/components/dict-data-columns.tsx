import { type ColumnDef } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { Checkbox } from '@/components/ui/checkbox'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { dash } from '../../../shared/constants'
import { type SysDictDataVo } from '../../api'
import { DataTableRowActions } from './dict-data-row-actions'

export const dictDataColumns: ColumnDef<SysDictDataVo>[] = [
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
    accessorKey: 'dictLabel',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='字典标签' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36 ps-3'>{row.getValue('dictLabel')}</LongText>
    ),
    enableHiding: false,
  },
  {
    accessorKey: 'dictValue',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='字典键值' />
    ),
    cell: ({ row }) => (
      <LongText className='max-w-36'>{row.getValue('dictValue')}</LongText>
    ),
  },
  {
    accessorKey: 'dictSort',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='排序' />
    ),
    cell: ({ row }) => <div>{dash(row.getValue('dictSort'))}</div>,
    enableSorting: false,
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
    filterFn: (row, id, value: string[]) => value.includes(row.getValue(id)),
    enableSorting: false,
  },
  {
    accessorKey: 'isDefault',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='是否默认' />
    ),
    cell: ({ row }) => {
      const value = row.getValue('isDefault') as string | undefined
      return <div>{value === 'Y' ? '是' : value === 'N' ? '否' : '-'}</div>
    },
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
