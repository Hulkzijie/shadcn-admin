import { Link } from '@tanstack/react-router'
import { ArrowLeft, Bot } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function AgentHome() {
  return (
    <div className='flex min-h-svh flex-col items-center justify-center gap-4 p-6 text-center'>
      <div className='flex size-16 items-center justify-center rounded-2xl border-2 border-border'>
        <Bot className='size-8' />
      </div>
      <div className='space-y-1.5'>
        <h1 className='text-xl font-semibold tracking-tight'>Agent 工作台</h1>
        <p className='text-sm text-muted-foreground'>
          页面骨架已就绪，待参考稿确认后填充内容
        </p>
      </div>
      <Button variant='outline' size='sm' asChild>
        <Link to='/'>
          <ArrowLeft />
          返回首页
        </Link>
      </Button>
    </div>
  )
}
