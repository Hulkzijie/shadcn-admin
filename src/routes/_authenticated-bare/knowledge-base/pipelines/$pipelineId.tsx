import { createFileRoute } from '@tanstack/react-router'
import { PipelineEditor } from '@/features/knowledge-base/pipeline/editor'

export const Route = createFileRoute(
  '/_authenticated-bare/knowledge-base/pipelines/$pipelineId'
)({
  component: PipelineEditorPage,
})

function PipelineEditorPage() {
  const { pipelineId } = Route.useParams()
  return <PipelineEditor pipelineId={pipelineId} />
}
