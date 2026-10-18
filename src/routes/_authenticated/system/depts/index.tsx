import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { DeptList } from '@/features/system/dept'

const deptSearchSchema = z.object({
  deptName: z.string().optional().catch(''),
  status: z.array(z.string()).optional().catch([]),
})

export const Route = createFileRoute('/_authenticated/system/depts/')({
  validateSearch: deptSearchSchema,
  component: DeptList,
})
