import { createFileRoute } from '@tanstack/react-router'
import { AgentHome } from '@/features/agent'

export const Route = createFileRoute('/_authenticated-bare/agent/')({
  component: AgentHome,
})
