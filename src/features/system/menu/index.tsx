import z from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useRouteNavigate, useRouteSearch } from '@/hooks/use-route-search'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { listMenus, type SysMenuQuery } from './api'
import { MenuDialogs } from './components/menu-dialogs'
import { MenuPrimaryButtons } from './components/menu-primary-buttons'
import { MenuProvider } from './components/menu-provider'
import { MenuTable } from './components/menu-table'

const searchSchema = z.object({
  menuName: z.string().optional().catch(''),
  status: z.array(z.string()).optional().catch([]),
})

export function MenuList() {
  const search = useRouteSearch(searchSchema)
  const navigate = useRouteNavigate()

  const params: SysMenuQuery = {
    menuName: search.menuName || undefined,
    status: search.status?.[0] || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['system-menu-list', params],
    queryFn: () => listMenus(params),
  })

  const menuTree = data ?? []

  return (
    <MenuProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>菜单管理</h2>
            <p className='text-muted-foreground'>
              管理系统菜单、目录与按钮权限。
            </p>
          </div>
          <MenuPrimaryButtons />
        </div>
        {isLoading ? (
          <div className='flex flex-1 items-center justify-center text-sm text-muted-foreground'>
            加载中...
          </div>
        ) : (
          <MenuTable data={menuTree} search={search} navigate={navigate} />
        )}
      </Main>

      <MenuDialogs />
    </MenuProvider>
  )
}
