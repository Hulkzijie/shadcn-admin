import z from 'zod'
import { useQuery } from '@tanstack/react-query'
import { useRouteNavigate, useRouteSearch } from '@/hooks/use-route-search'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { listTenantPackages, type SysTenantPackageQuery } from './api'
import { TenantPackageDialogs } from './components/tenant-package-dialogs'
import { TenantPackagePrimaryButtons } from './components/tenant-package-primary-buttons'
import { TenantPackageProvider } from './components/tenant-package-provider'
import { TenantPackageTable } from './components/tenant-package-table'

const searchSchema = z.object({
  page: z.number().optional().catch(1),
  pageSize: z.number().optional().catch(10),
  packageName: z.string().optional().catch(''),
  status: z.array(z.string()).optional().catch([]),
})

export function TenantPackageList() {
  const search = useRouteSearch(searchSchema)
  const navigate = useRouteNavigate()

  const params: SysTenantPackageQuery = {
    pageNum: search.page ?? 1,
    pageSize: search.pageSize ?? 10,
    packageName: search.packageName || undefined,
    status: search.status?.[0] || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['system-tenant-package-list', params],
    queryFn: () => listTenantPackages(params),
  })

  return (
    <TenantPackageProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>租户套餐</h2>
            <p className='text-muted-foreground'>
              维护租户套餐及其可用的菜单权限。
            </p>
          </div>
          <TenantPackagePrimaryButtons />
        </div>
        {isLoading ? (
          <div className='flex flex-1 items-center justify-center text-sm text-muted-foreground'>
            加载中...
          </div>
        ) : (
          <TenantPackageTable
            data={data?.rows ?? []}
            total={data?.total ?? 0}
            search={search}
            navigate={navigate}
          />
        )}
      </Main>

      <TenantPackageDialogs />
    </TenantPackageProvider>
  )
}
