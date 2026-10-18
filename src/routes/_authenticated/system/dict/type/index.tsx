import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { DictTypeList } from '@/features/system/dict/type'

const searchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  dictName: z.string().optional().catch(''),
  dictType: z.string().optional().catch(''),
})

export const Route = createFileRoute('/_authenticated/system/dict/type/')({
  validateSearch: searchSchema,
  component: DictTypeList,
})
