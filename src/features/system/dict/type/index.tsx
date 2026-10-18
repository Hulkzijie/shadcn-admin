import { getRouteApi } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { listDictTypes, type SysDictTypeQuery } from '../api'
import { DictTypeDialogs } from './components/dict-type-dialogs'
import { DictTypePrimaryButtons } from './components/dict-type-primary-buttons'
import { DictTypeProvider } from './components/dict-type-provider'
import { DictTypeTable } from './components/dict-type-table'

const route = getRouteApi('/_authenticated/system/dict/type/')

export function DictTypeList() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const params: SysDictTypeQuery = {
    pageNum: search.page ?? 1,
    pageSize: search.pageSize ?? 10,
    dictName: search.dictName || undefined,
    dictType: search.dictType || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['system-dict-type-list', params],
    queryFn: () => listDictTypes(params),
  })

  return (
    <DictTypeProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>字典类型</h2>
            <p className='text-muted-foreground'>管理数据字典的类型定义。</p>
          </div>
          <DictTypePrimaryButtons />
        </div>
        {isLoading ? (
          <div className='flex flex-1 items-center justify-center text-sm text-muted-foreground'>
            加载中...
          </div>
        ) : (
          <DictTypeTable
            data={data?.rows ?? []}
            total={data?.total ?? 0}
            search={search}
            navigate={navigate}
          />
        )}
      </Main>

      <DictTypeDialogs />
    </DictTypeProvider>
  )
}
