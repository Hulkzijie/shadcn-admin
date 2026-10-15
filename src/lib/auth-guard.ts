import { redirect } from '@tanstack/react-router'
import { useAuthStore } from '@/stores/auth-store'

/**
 * 登录态校验，供受保护的路由布局（带侧边栏 / 全屏等）复用。
 * 未登录或用户信息拉取失败时统一跳转到登录页并回填 redirect。
 */
export async function ensureAuthenticated(redirectTo: string) {
  const { auth } = useAuthStore.getState()

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
}
