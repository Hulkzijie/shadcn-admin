import { createFileRoute } from '@tanstack/react-router'
import { AgentFlow } from '@/features/agent/flow'

export const Route = createFileRoute(
  '/_authenticated-bare/agents/$agentId/flow'
)({
  component: AgentFlowPage,
})

function AgentFlowPage() {
  const { agentId } = Route.useParams()
  return <AgentFlow agentId={agentId} />
}
