import { getRouteApi } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { listTenants, type SysTenantQuery } from './api'
import { TenantDialogs } from './components/tenant-dialogs'
import { TenantPrimaryButtons } from './components/tenant-primary-buttons'
import { TenantProvider } from './components/tenant-provider'
import { TenantTable } from './components/tenant-table'

const route = getRouteApi('/_authenticated/system/tenants/')

export function TenantList() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const params: SysTenantQuery = {
    pageNum: search.page ?? 1,
    pageSize: search.pageSize ?? 10,
    companyName: search.companyName || undefined,
    contactUserName: search.contactUserName || undefined,
    status: search.status?.[0] || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['system-tenant-list', params],
    queryFn: () => listTenants(params),
  })

  return (
    <TenantProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>租户管理</h2>
            <p className='text-muted-foreground'>
              管理多租户信息与企业套餐、状态。
            </p>
          </div>
          <TenantPrimaryButtons />
        </div>
        {isLoading ? (
          <div className='flex flex-1 items-center justify-center text-sm text-muted-foreground'>
            加载中...
          </div>
        ) : (
          <TenantTable
            data={data?.rows ?? []}
            total={data?.total ?? 0}
            search={search}
            navigate={navigate}
          />
        )}
      </Main>

      <TenantDialogs />
    </TenantProvider>
  )
}
