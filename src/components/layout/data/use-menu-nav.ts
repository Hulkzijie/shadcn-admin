import {
  createElement,
  useEffect,
  useMemo,
  useState,
  type ComponentProps,
} from 'react'
import type { LucideIcon } from 'lucide-react'
import { dynamicIconImports, type IconName } from 'lucide-react/dynamic'
import {
  LAYOUT_COMPONENTS,
  normalizeComponent,
  normalizePath,
  resolveMenuPath,
  useMenuRouters,
} from '@/lib/menu-routes'
import type { RouterVo } from '@/features/auth/api/auth-api'
import type { NavGroup, NavItem } from '../types'

/** 已加载完成的 lucide 动态图标组件缓存，避免菜单重渲染时图标闪烁 */
const lucideIconCache = new Map<string, LucideIcon>()

/** PascalCase / camelCase 的 lucide 图标名 → lucide 使用的 kebab-case 名 */
function toKebabCase(icon: string): string {
  return icon
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase()
}

/**
 * 菜单图标只支持 lucide 图标名（如 LayoutDashboard / layout-dashboard）。
 * 按需异步加载对应图标组件；未配置或无法识别时返回 undefined，菜单只显示文字。
 */
function resolveIcon(icon?: string): LucideIcon | undefined {
  if (!icon) return undefined
  const iconName = toKebabCase(icon)
  if (!(iconName in dynamicIconImports)) return undefined

  const name = iconName as IconName
  const cached = lucideIconCache.get(name)
  if (cached) return cached

  function DynamicMenuIcon(props: ComponentProps<LucideIcon>) {
    const [Icon, setIcon] = useState<LucideIcon | undefined>(() =>
      lucideIconCache.get(name)
    )

    useEffect(() => {
      if (Icon) return
      let cancelled = false
      void dynamicIconImports[name]()
        .then((module) => {
          lucideIconCache.set(name, module.default)
          if (!cancelled) setIcon(() => module.default)
        })
        .catch(() => {
          // 图标分块加载失败时保持无图标，不影响菜单展示
        })
      return () => {
        cancelled = true
      }
    }, [Icon])

    return Icon ? createElement(Icon, props) : null
  }

  return DynamicMenuIcon as unknown as LucideIcon
}

/**
 * 后台菜单节点 → 侧边栏节点，保留父子层级。
 * 目录节点生成可展开的 items，叶子节点生成 url 链接。
 */
function toNavItem(route: RouterVo, parentPath = ''): NavItem | undefined {
  if (route.hidden) return undefined

  const fullPath = normalizePath(route.path, parentPath)
  const visibleChildren = (route.children ?? []).filter(
    (child) => !child.hidden
  )

  // 与 RuoYi 一致：目录下只有一个子菜单且未设置 alwaysShow 时，直接展示子菜单
  if (visibleChildren.length === 1 && !route.alwaysShow) {
    return toNavItem(visibleChildren[0], fullPath)
  }

  const title = route.meta?.title ?? route.name
  const icon = resolveIcon(route.meta?.icon)
  const children = visibleChildren
    .map((child) => toNavItem(child, fullPath))
    .filter((item): item is NavItem => Boolean(item))

  if (children.length) return { title, icon, items: children }

  // 无子节点且不是页面组件（如空的目录节点）时跳过
  const component = normalizeComponent(route.component)
  if (!component || LAYOUT_COMPONENTS.has(component)) return undefined

  return { title, icon, url: resolveMenuPath(fullPath, component) }
}

/**
 * 把 getRouters 返回的树转换为侧边栏结构：
 * 顶层节点统一放在一个无标题分组内，目录节点自身可展开，保留完整父子层级。
 */
function buildNavGroups(routes: RouterVo[]): NavGroup[] {
  const items = routes
    .map((route) => toNavItem(route))
    .filter((item): item is NavItem => Boolean(item))

  return items.length ? [{ title: '', items }] : []
}

/**
 * 获取后台返回的菜单树并转换为侧边栏可用结构。
 */
export function useMenuNav() {
  const { routers, isLoading } = useMenuRouters()
  const navGroups = useMemo(
    () => (routers.length ? buildNavGroups(routers) : []),
    [routers]
  )

  return { navGroups, isLoading }
}
