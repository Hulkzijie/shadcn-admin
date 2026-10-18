import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTenant } from './tenant-provider'

export function TenantPrimaryButtons() {
  const { setOpen } = useTenant()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>新增租户</span> <Building2 size={18} />
      </Button>
    </div>
  )
}
