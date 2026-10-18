import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { DictDataList } from '@/features/system/dict/data'

const searchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  dictLabel: z.string().optional().catch(''),
  dictType: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/system/dict/data/')({
  validateSearch: searchSchema,
  component: DictDataList,
})
