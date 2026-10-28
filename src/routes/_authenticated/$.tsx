import { createFileRoute } from '@tanstack/react-router'
import { DynamicRoutePage } from '@/features/router/dynamic-route-page'

export const Route = createFileRoute('/_authenticated/$')({
  component: DynamicRoutePage,
})
