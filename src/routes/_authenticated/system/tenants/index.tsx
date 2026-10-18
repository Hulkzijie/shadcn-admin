import z from 'zod'
import { createFileRoute } from '@tanstack/react-router'
import { TenantList } from '@/features/system/tenant'

const tenantSearchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  companyName: z.string().optional().catch(''),
  contactUserName: z.string().optional().catch(''),
  status: z.array(z.string()).optional().catch([]),
})

export const Route = createFileRoute('/_authenticated/system/tenants/')({
  validateSearch: tenantSearchSchema,
  component: TenantList,
})
