import { getRouteApi } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { listUsers, type SysUserQuery } from './api'
import { UserDialogs } from './components/user-dialogs'
import { UserPrimaryButtons } from './components/user-primary-buttons'
import { UserProvider } from './components/user-provider'
import { UserTable } from './components/user-table'

const route = getRouteApi('/_authenticated/system/users/')

export function UserList() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const params: SysUserQuery = {
    pageNum: search.page ?? 1,
    pageSize: search.pageSize ?? 10,
    userName: search.userName || undefined,
    status: search.status?.[0] || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['system-user-list', params],
    queryFn: () => listUsers(params),
  })

  return (
    <UserProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>用户管理</h2>
            <p className='text-muted-foreground'>
              管理系统用户、部门归属与角色权限。
            </p>
          </div>
          <UserPrimaryButtons />
        </div>
        {isLoading ? (
          <div className='flex flex-1 items-center justify-center text-sm text-muted-foreground'>
            加载中...
          </div>
        ) : (
          <UserTable
            data={data?.rows ?? []}
            total={data?.total ?? 0}
            search={search}
            navigate={navigate}
          />
        )}
      </Main>

      <UserDialogs />
    </UserProvider>
  )
}
