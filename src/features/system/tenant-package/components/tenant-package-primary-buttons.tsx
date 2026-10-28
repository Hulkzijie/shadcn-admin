import { PackagePlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTenantPackage } from './tenant-package-provider'

export function TenantPackagePrimaryButtons() {
  const { setOpen } = useTenantPackage()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>新增套餐</span> <PackagePlus size={18} />
      </Button>
    </div>
  )
}
