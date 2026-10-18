import { BookMarked } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDictType } from './dict-type-provider'

export function DictTypePrimaryButtons() {
  const { setOpen } = useDictType()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>新增字典类型</span> <BookMarked size={18} />
      </Button>
    </div>
  )
}
