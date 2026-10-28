import { useQuery } from '@tanstack/react-query'
import { useAuthStore } from '@/stores/auth-store'
import { getRouters, type RouterVo } from '@/features/auth/api/auth-api'

/**
 * 后端菜单路径 → 前端访问路径。
 * 仅在后台菜单 path 与前端约定路径不一致时使用。
 */
const PATH_ALIAS: Record<string, string> = {
  '/index': '/',
  '/dashboard': '/',
  '/system/user': '/system/users',
  '/system/role': '/system/roles',
  '/system/menu': '/system/menus',
  '/system/dept': '/system/depts',
  '/system/dict': '/system/dict/type',
  '/system/tenant': '/system/tenants',
}

/**
 * 后端 component → 前端固定访问路径。
 * 只要后台 component 填了已知值，访问路径就固定为改造前的路径，
 * 不受后台 path 字段影响（如 path 填 agent 仍访问 /agents）。
 */
const COMPONENT_PATHS: Record<string, string> = {
  index: '/',
  'dashboard/index': '/',
  'gis/index': '/gis',
  'agent/index': '/agents',
  'agents/index': '/agents',
  'qa/index': '/qa',
  'ai-chat/index': '/ai-chat',
  'app-plaza/index': '/app-plaza',
  'knowledge-base/index': '/knowledge-base',
  'chats/index': '/chats',
  'apps/index': '/apps',
  'user/index': '/users',
  'users/index': '/users',
  'task/index': '/tasks',
  'tasks/index': '/tasks',
  'help-center/index': '/help-center',
  'system/user/index': '/system/users',
  'system/role/index': '/system/roles',
  'system/menu/index': '/system/menus',
  'system/dept/index': '/system/depts',
  'system/dict/index': '/system/dict/type',
  'system/dict/type/index': '/system/dict/type',
  'system/dict/data/index': '/system/dict/data',
  'system/tenant/index': '/system/tenants',
  'system/tenantPackage/index': '/tenant/tenantPackage',
}

/** 目录型菜单的组件名，不对应任何前端页面 */
export const LAYOUT_COMPONENTS = new Set(['Layout', 'ParentView'])

/** 拼接父子路径并归一化（后端子菜单 path 通常是相对路径） */
export function normalizePath(path: string, parentPath = ''): string {
  const raw = path ?? ''
  const combined = raw.startsWith('/') ? raw : `${parentPath}/${raw}`
  const normalized = `/${combined}`.replace(/\/+/g, '/').replace(/\/$/, '')
  return normalized || '/'
}

/** 统一后端 component 写法，如 `/system/user/index.vue` → `system/user/index` */
export function normalizeComponent(component?: string): string | undefined {
  const normalized = component
    ?.trim()
    .replace(/^\/+/, '')
    .replace(/\.vue$/, '')
  return normalized || undefined
}

/** 后端路由 → 前端实际访问路径 */
export function resolveMenuPath(fullPath: string, component?: string): string {
  const key = normalizeComponent(component)
  if (key && COMPONENT_PATHS[key]) return COMPONENT_PATHS[key]
  if (PATH_ALIAS[fullPath]) return PATH_ALIAS[fullPath]
  return fullPath
}

export type MenuRouteEntry = {
  /** 前端实际访问路径 */
  path: string
  /** 后端组件标识，如 system/user/index */
  component: string
  /** 菜单标题 */
  title: string
}

/**
 * 把后台菜单树拍平成「访问路径 → 组件」表。
 * 与侧边栏不同，这里包含 hidden 菜单（如字典数据），隐藏菜单也需要可访问。
 */
export function flattenMenuRoutes(
  routes: RouterVo[],
  parentPath = ''
): MenuRouteEntry[] {
  return routes.flatMap((route) => {
    const fullPath = normalizePath(route.path, parentPath)
    const component = normalizeComponent(route.component)
    const children = flattenMenuRoutes(route.children ?? [], fullPath)

    if (!component || LAYOUT_COMPONENTS.has(component)) return children

    return [
      {
        path: resolveMenuPath(fullPath, component),
        component,
        title: route.meta?.title ?? route.name,
      },
      ...children,
    ]
  })
}

/**
 * 获取后台返回的菜单树。
 * 菜单随用户变化，queryKey 带上 userId 避免切换账号复用旧缓存。
 */
export function useMenuRouters() {
  const userId = useAuthStore((state) => state.auth.user?.userId)

  const { data, isPending } = useQuery({
    queryKey: ['menu-routers', userId],
    queryFn: async () => {
      const res = await getRouters()
      if (res.data.code !== 200) {
        throw new Error(res.data.msg || '获取菜单失败')
      }
      return res.data.data ?? []
    },
    staleTime: 5 * 60 * 1000,
  })

  return { routers: data ?? [], isLoading: isPending }
}
