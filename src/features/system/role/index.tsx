import z from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useRouteNavigate, useRouteSearch } from '@/hooks/use-route-search'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { listRoles, type SysRoleQuery } from './api'
import { RoleDialogs } from './components/role-dialogs'
import { RolePrimaryButtons } from './components/role-primary-buttons'
import { RoleProvider } from './components/role-provider'
import { RoleTable } from './components/role-table'

const searchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  roleName: z.string().optional().catch(''),
  status: z.array(z.string()).optional().catch([]),
})

export function RoleList() {
  const search = useRouteSearch(searchSchema)
  const navigate = useRouteNavigate()

  const params: SysRoleQuery = {
    pageNum: search.page ?? 1,
    pageSize: search.pageSize ?? 10,
    roleName: search.roleName || undefined,
    status: search.status?.[0] || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['system-role-list', params],
    queryFn: () => listRoles(params),
  })

  return (
    <RoleProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>角色管理</h2>
            <p className='text-muted-foreground'>
              管理系统角色及其权限字符、显示顺序与状态。
            </p>
          </div>
          <RolePrimaryButtons />
        </div>
        {isLoading ? (
          <div className='flex flex-1 items-center justify-center text-sm text-muted-foreground'>
            加载中...
          </div>
        ) : (
          <RoleTable
            data={data?.rows ?? []}
            total={data?.total ?? 0}
            search={search}
            navigate={navigate}
          />
        )}
      </Main>

      <RoleDialogs />
    </RoleProvider>
  )
}
