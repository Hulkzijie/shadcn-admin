import { ShieldPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useRole } from './role-provider'

export function RolePrimaryButtons() {
  const { setOpen } = useRole()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>新增角色</span> <ShieldPlus size={18} />
      </Button>
    </div>
  )
}
