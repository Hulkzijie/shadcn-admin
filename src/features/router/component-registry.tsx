import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export type ComponentLoader = () => Promise<{ default: ComponentType }>

const dashboard: ComponentLoader = () =>
  import('@/features/dashboard').then((m) => ({ default: m.Dashboard }))
const gis: ComponentLoader = () =>
  import('@/features/gis').then((m) => ({ default: m.GisPage }))
const agentList: ComponentLoader = () =>
  import('@/features/agent/list').then((m) => ({ default: m.AgentList }))
const qa: ComponentLoader = () =>
  import('@/features/qa').then((m) => ({ default: m.Qa }))
const aiChat: ComponentLoader = () =>
  import('@/features/ai-chat').then((m) => ({ default: m.AiChat }))
const appPlaza: ComponentLoader = () =>
  import('@/features/app-plaza').then((m) => ({ default: m.AppPlaza }))
const knowledgeBase: ComponentLoader = () =>
  import('@/features/knowledge-base').then((m) => ({
    default: m.KnowledgeBase,
  }))
const chats: ComponentLoader = () =>
  import('@/features/chats').then((m) => ({ default: m.Chats }))
const apps: ComponentLoader = () =>
  import('@/features/apps').then((m) => ({ default: m.Apps }))
const users: ComponentLoader = () =>
  import('@/features/users').then((m) => ({ default: m.Users }))
const tasks: ComponentLoader = () =>
  import('@/features/tasks').then((m) => ({ default: m.Tasks }))
const comingSoon: ComponentLoader = () =>
  import('@/components/coming-soon').then((m) => ({ default: m.ComingSoon }))

const userList: ComponentLoader = () =>
  import('@/features/system/user').then((m) => ({ default: m.UserList }))
const roleList: ComponentLoader = () =>
  import('@/features/system/role').then((m) => ({ default: m.RoleList }))
const menuList: ComponentLoader = () =>
  import('@/features/system/menu').then((m) => ({ default: m.MenuList }))
const deptList: ComponentLoader = () =>
  import('@/features/system/dept').then((m) => ({ default: m.DeptList }))
const dictTypeList: ComponentLoader = () =>
  import('@/features/system/dict/type').then((m) => ({
    default: m.DictTypeList,
  }))
const dictDataList: ComponentLoader = () =>
  import('@/features/system/dict/data').then((m) => ({
    default: m.DictDataList,
  }))
const tenantList: ComponentLoader = () =>
  import('@/features/system/tenant').then((m) => ({
    default: m.TenantList,
  }))
const tenantPackageList: ComponentLoader = () =>
  import('@/features/system/tenant-package').then((m) => ({
    default: m.TenantPackageList,
  }))

/** 后台菜单 component 字段（RuoYi 默认格式）→ 前端组件 */
const COMPONENT_LOADERS: Record<string, ComponentLoader> = {
  index: dashboard,
  'dashboard/index': dashboard,
  'system/user/index': userList,
  'system/role/index': roleList,
  'system/menu/index': menuList,
  'system/dept/index': deptList,
  'system/dict/index': dictTypeList,
  'system/dict/type/index': dictTypeList,
  'system/dict/data/index': dictDataList,
  'system/tenant/index': tenantList,
  'system/tenantPackage/index': tenantPackageList,
  'agent/index': agentList,
  'agents/index': agentList,
  'gis/index': gis,
  'qa/index': qa,
  'ai-chat/index': aiChat,
  'app-plaza/index': appPlaza,
  'knowledge-base/index': knowledgeBase,
  'chats/index': chats,
  'apps/index': apps,
  'user/index': users,
  'users/index': users,
  'task/index': tasks,
  'tasks/index': tasks,
  'help-center/index': comingSoon,
}

/** 后台 component 与前端约定不一致时，按访问路径兜底 */
const PATH_LOADERS: Record<string, ComponentLoader> = {
  '/': dashboard,
  '/gis': gis,
  '/agents': agentList,
  '/qa': qa,
  '/ai-chat': aiChat,
  '/app-plaza': appPlaza,
  '/knowledge-base': knowledgeBase,
  '/chats': chats,
  '/apps': apps,
  '/users': users,
  '/tasks': tasks,
  '/help-center': comingSoon,
  '/system/users': userList,
  '/system/roles': roleList,
  '/system/menus': menuList,
  '/system/depts': deptList,
  '/system/dict/type': dictTypeList,
  '/system/dict/data': dictDataList,
  '/system/tenants': tenantList,
  '/tenant/tenantPackage': tenantPackageList,
}

function normalizeKey(component?: string): string | undefined {
  const key = component
    ?.trim()
    .replace(/^\/+/, '')
    .replace(/\.vue$/, '')
  return key || undefined
}

type LazyComponent = LazyExoticComponent<ComponentType>

/** lazy 组件在模块加载时只创建一次，避免在渲染期创建组件 */
const lazyCache = new Map<ComponentLoader, LazyComponent>()

function toComponent(loader: ComponentLoader): LazyComponent {
  let component = lazyCache.get(loader)
  if (!component) {
    component = lazy(loader)
    lazyCache.set(loader, component)
  }
  return component
}

function buildComponents(loaders: Record<string, ComponentLoader>) {
  return Object.fromEntries(
    Object.entries(loaders).map(([key, loader]) => [key, toComponent(loader)])
  ) as Record<string, LazyComponent>
}

const COMPONENTS = buildComponents(COMPONENT_LOADERS)
const PATH_COMPONENTS = buildComponents(PATH_LOADERS)

export type ResolvedComponent = {
  key: string
  Component: LazyComponent
}

export function resolveComponent(
  component?: string,
  path?: string
): ResolvedComponent | undefined {
  const key = normalizeKey(component)
  if (key && COMPONENTS[key]) {
    return { key, Component: COMPONENTS[key] }
  }
  if (path && PATH_COMPONENTS[path]) {
    return { key: `path:${path}`, Component: PATH_COMPONENTS[path] }
  }
  return undefined
}
