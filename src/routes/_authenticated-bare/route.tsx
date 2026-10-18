import { createFileRoute, Outlet } from '@tanstack/react-router'
import { ensureAuthenticated } from '@/lib/auth-guard'
import { LayoutProvider } from '@/context/layout-provider'
import { SidebarProvider } from '@/components/ui/sidebar'

/**
 * 无侧边栏的受保护布局：用于 Agent 这类需要全屏沉浸式体验的页面。
 * 仍提供 LayoutProvider / SidebarProvider，使头部 Theme Settings 抽屉可正常使用。
 */
export const Route = createFileRoute('/_authenticated-bare')({
  component: BareLayout,
  beforeLoad: async ({ location }) => {
    await ensureAuthenticated(location.pathname + location.searchStr)
  },
})

function BareLayout() {
  return (
    <LayoutProvider>
      <SidebarProvider>
        <Outlet />
      </SidebarProvider>
    </LayoutProvider>
  )
}
