import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { MenuList } from '@/features/system/menu'

const menuSearchSchema = z.object({
  menuName: z.string().optional().catch(''),
  status: z.array(z.string()).optional().catch([]),
})

export const Route = createFileRoute('/_authenticated/system/menus/')({
  validateSearch: menuSearchSchema,
  component: MenuList,
})
