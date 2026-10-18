import { Menu as MenuIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useMenu } from './menu-provider'

export function MenuPrimaryButtons() {
  const { setOpen } = useMenu()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>新增菜单</span> <MenuIcon size={18} />
      </Button>
    </div>
  )
}
