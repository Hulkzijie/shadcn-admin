import { Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDept } from './dept-provider'

export function DeptPrimaryButtons() {
  const { setOpen } = useDept()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>新增部门</span> <Building2 size={18} />
      </Button>
    </div>
  )
}
