import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { UserList } from '@/features/system/user'

const userSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  userName: z.string().optional().catch(''),
  status: z.array(z.string()).optional().catch([]),
})

export const Route = createFileRoute('/_authenticated/system/users/')({
  validateSearch: userSearchSchema,
  component: UserList,
})
