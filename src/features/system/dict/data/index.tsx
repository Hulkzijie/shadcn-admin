import { getRouteApi } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import {
  dictTypeOptionSelect,
  listDictData,
  type SysDictDataQuery,
} from '../api'
import { DictDataDialogs } from './components/dict-data-dialogs'
import { DictDataPrimaryButtons } from './components/dict-data-primary-buttons'
import { DictDataProvider } from './components/dict-data-provider'
import { DictDataTable } from './components/dict-data-table'

const route = getRouteApi('/_authenticated/system/dict/data/')

export function DictDataList() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const params: SysDictDataQuery = {
    pageNum: search.page ?? 1,
    pageSize: search.pageSize ?? 10,
    dictType: search.dictType || undefined,
    dictLabel: search.dictLabel || undefined,
  }

  const { data, isLoading } = useQuery({
    queryKey: ['system-dict-data-list', params],
    queryFn: () => listDictData(params),
  })

  const { data: dictTypeOptions } = useQuery({
    queryKey: ['system-dict-type-options'],
    queryFn: dictTypeOptionSelect,
  })

  return (
    <DictDataProvider>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>字典数据</h2>
            <p className='text-muted-foreground'>
              管理某一字典类型下的数据项。
            </p>
          </div>
          <DictDataPrimaryButtons />
        </div>
        {isLoading ? (
          <div className='flex flex-1 items-center justify-center text-sm text-muted-foreground'>
            加载中...
          </div>
        ) : (
          <DictDataTable
            data={data?.rows ?? []}
            total={data?.total ?? 0}
            search={search}
            navigate={navigate}
            dictTypeOptions={dictTypeOptions ?? []}
          />
        )}
      </Main>

      <DictDataDialogs dictTypeOptions={dictTypeOptions ?? []} />
    </DictDataProvider>
  )
}
