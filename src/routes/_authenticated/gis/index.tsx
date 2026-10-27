import { createFileRoute } from '@tanstack/react-router'
import { GisPage } from '@/features/gis'

export const Route = createFileRoute('/_authenticated/gis/')({
  component: GisPage,
})
