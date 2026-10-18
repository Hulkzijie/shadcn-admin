import { createFileRoute } from '@tanstack/react-router'
import { AgentList } from '@/features/agent/list'

export const Route = createFileRoute('/_authenticated/agents/')({
  component: AgentList,
})
