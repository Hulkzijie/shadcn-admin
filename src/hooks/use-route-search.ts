import type { ZodType } from 'zod'
import { useNavigate, useSearch } from '@tanstack/react-router'
import type { NavigateFn } from '@/hooks/use-table-url-state'

/**
 * 读取当前 URL search 并按 zod schema 归一化。
 * 动态路由无法在编译期声明 validateSearch，因此由组件自己解析。
 */
export function useRouteSearch<T>(schema: ZodType<T>): T {
  const search = useSearch({ strict: false })
  return schema.parse(search)
}

/**
 * 只更新 search 的跳转，不依赖具体路由 id，适用于动态路由。
 */
export function useRouteNavigate(): NavigateFn {
  const navigate = useNavigate()
  return (opts) =>
    navigate({
      // 动态路由的 search 为宽松类型，这里交由运行时合并
      search: opts.search as never,
      replace: opts.replace,
    })
}
