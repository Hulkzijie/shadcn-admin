import { createFileRoute, redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
  beforeLoad: async ({ location }) => {
    const { auth } = useAuthStore.getState()
    const redirectTo = location.pathname + location.searchStr

    if (!auth.isAuthenticated()) {
      throw redirect({
        to: '/sign-in',
        search: { redirect: redirectTo },
      })
    }

    // 刷新页面后 Token 仍在 Cookie 中，但用户信息为空，需要重新拉取
    if (!auth.user) {
      try {
        await auth.getUserInfo()
      } catch {
        auth.reset()
        throw redirect({
          to: '/sign-in',
          search: { redirect: redirectTo },
        })
      }
    }
  },
})
