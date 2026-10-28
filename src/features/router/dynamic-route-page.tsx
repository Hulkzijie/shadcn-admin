import { Suspense, useMemo } from 'react'
import { useRouterState } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { flattenMenuRoutes, useMenuRouters } from '@/lib/menu-routes'
import { ComingSoon } from '@/components/coming-soon'
import { resolveComponent } from '@/features/router/component-registry'

function RouteFallback() {
  return (
    <div className='flex h-full flex-1 items-center justify-center gap-2 py-24 text-sm text-muted-foreground'>
      <Loader2 className='size-4 animate-spin' />
      加载中...
    </div>
  )
}

/**
 * 业务页面统一入口：路径由后台菜单决定，
 * 这里按当前 pathname 找到对应的后台 component 并渲染前端组件。
 */
export function DynamicRoutePage() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  })
  const { routers, isLoading } = useMenuRouters()

  const resolved = useMemo(() => {
    const current = pathname.replace(/\/+$/, '') || '/'
    const entry = flattenMenuRoutes(routers).find(
      (item) => item.path === current
    )
    return resolveComponent(entry?.component, current)
  }, [routers, pathname])

  if (isLoading) return <RouteFallback />
  if (!resolved) return <ComingSoon />

  const Page = resolved.Component

  return (
    <Suspense fallback={<RouteFallback />}>
      <Page />
    </Suspense>
  )
}
