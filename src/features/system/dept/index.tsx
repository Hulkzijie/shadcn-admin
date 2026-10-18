import { getRouteApi } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { flattenDepts, listDepts, type SysDeptQuery } from './api'
import { DeptDialogs } from './components/dept-dialogs'
import { DeptPrimaryButtons } from './components/dept-primary-buttons'
import { DeptProvider } from './components/dept-provider'
import { DeptTable } from './components/dept-table'

const route = getRouteApi('/_authenticated/system/depts/')

export function DeptList() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const params: SysDeptQuery = {
    deptName: search.deptName || undefined,
    status: search.status?.[0] || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['system-dept-list', params],
    queryFn: () => listDepts(params),
  })

  const flatDepts = flattenDepts(data)

  return (
    <DeptProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>部门管理</h2>
            <p className='text-muted-foreground'>
              管理组织架构中的部门层级与信息。
            </p>
          </div>
          <DeptPrimaryButtons />
        </div>
        {isLoading ? (
          <div className='flex flex-1 items-center justify-center text-sm text-muted-foreground'>
            加载中...
          </div>
        ) : (
          <DeptTable data={flatDepts} search={search} navigate={navigate} />
        )}
      </Main>

      <DeptDialogs />
    </DeptProvider>
  )
}
