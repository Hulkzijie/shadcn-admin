import { createFileRoute } from '@tanstack/react-router'
import { ensureAuthenticated } from '@/lib/auth-guard'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
  beforeLoad: async ({ location }) => {
    await ensureAuthenticated(location.pathname + location.searchStr)
  },
})
