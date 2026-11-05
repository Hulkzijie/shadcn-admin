import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Card } from '@/components/ui/card'
import { CadCanvas } from './components/cad-canvas'
import { MOCK_BOUNDARY, MOCK_ELEMENTS } from './data/mock-drawing'
import { CadStoreProvider } from './store-provider'

export function CadPage() {
  return (
    <>
      <Header fixed>
        <Search className='me-auto' />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      <Main className='flex flex-1 flex-col gap-4 sm:gap-6'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>CAD 图纸</h2>
          <p className='text-muted-foreground'>
            机房平面图浏览：底图、图元渲染与拖拽编辑。
          </p>
        </div>

        <Card className='h-[72vh] gap-0 overflow-hidden p-0'>
          <CadStoreProvider
            initial={{
              boundary: MOCK_BOUNDARY,
              elementList: MOCK_ELEMENTS,
              baseZoom: MOCK_BOUNDARY[4] ?? 12,
              fontSize: MOCK_BOUNDARY[5] ?? 12,
            }}
          >
            <CadCanvas />
          </CadStoreProvider>
        </Card>
      </Main>
    </>
  )
}
