import { createFileRoute } from '@tanstack/react-router'
import { Qa } from '@/features/qa'

export const Route = createFileRoute('/_authenticated/qa/')({
  component: Qa,
})
