import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated-bare/agent/flow')({
  beforeLoad: () => {
    throw redirect({ to: '/agents' })
  },
})
