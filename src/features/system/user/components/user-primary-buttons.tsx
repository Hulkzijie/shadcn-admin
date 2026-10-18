import { UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useUser } from './user-provider'

export function UserPrimaryButtons() {
  const { setOpen } = useUser()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>新增用户</span> <UserPlus size={18} />
      </Button>
    </div>
  )
}
