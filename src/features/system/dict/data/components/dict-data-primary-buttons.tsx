import { BookMarked } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDictData } from './dict-data-provider'

export function DictDataPrimaryButtons() {
  const { setOpen } = useDictData()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('add')}>
        <span>新增字典数据</span> <BookMarked size={18} />
      </Button>
    </div>
  )
}
