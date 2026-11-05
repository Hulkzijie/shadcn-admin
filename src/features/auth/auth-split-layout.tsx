import { Bot, Sparkles, Workflow } from 'lucide-react'
import { Logo } from '@/assets/logo'
import { Badge } from '@/components/ui/badge'
import { AgentFlowDiagram } from './components/agent-flow-diagram'

const features = [
  {
    icon: Bot,
    title: '多智能体协作',
  },
  {
    icon: Sparkles,
    title: '知识库增强',
  },
  {
    icon: Workflow,
    title: '自动化工作流',
  },
]

type AuthSplitLayoutProps = {
  headline: string
  highlight: string
  description: string
  children: React.ReactNode
}

export function AuthSplitLayout({
  headline,
  highlight,
  description,
  children,
}: AuthSplitLayoutProps) {
  return (
    <div className='grid min-h-svh w-full lg:h-svh lg:grid-cols-2'>
      {/* 左侧品牌 & 产品叙事（常暗面板，使用 dark 作用域下的语义色） */}
      <div className='dark relative hidden overflow-hidden bg-background text-foreground lg:flex lg:flex-col lg:p-12 [@media(max-height:820px)]:p-8'>
        {/* 背景：柔和径向高光 + 极淡网格 */}
        <div aria-hidden className='pointer-events-none absolute inset-0'>
          <div className='absolute inset-x-0 top-0 h-105 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(110,86,207,0.20),transparent_70%)]' />
          <div className='absolute -top-24 -left-16 size-128 animate-[float_18s_ease-in-out_infinite] rounded-full bg-[#6e56cf]/10 blur-[140px] motion-reduce:animate-none' />
          <div className='absolute -right-24 bottom-0 size-112 animate-[float_20s_ease-in-out_infinite_2s] rounded-full bg-[#0091ff]/10 blur-[140px] motion-reduce:animate-none' />
          <div className='absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_center,black,transparent_75%)] bg-size-[56px_56px]' />
        </div>

        {/* 背景：Agent 编排链路动效，作为下半部视觉主体 */}
        <div
          aria-hidden
          className='pointer-events-none absolute inset-0 overflow-hidden'
        >
          <AgentFlowDiagram className='absolute bottom-[6%] left-1/2 w-[88%] max-w-none -translate-x-1/2 mask-[radial-gradient(ellipse_at_50%_52%,black_52%,transparent_88%)] opacity-60 [@media(max-height:820px)]:bottom-[4%]' />
        </div>

        <div className='relative z-10 flex shrink-0 items-center justify-between gap-4'>
          <div className='flex items-center gap-2'>
            <Logo className='size-7' />
            <span className='text-lg font-semibold tracking-tight'>
              WiseCloud AI
            </span>
          </div>
          <span className='text-xs text-muted-foreground/60'>
            © {new Date().getFullYear()}
          </span>
        </div>

        <div className='relative z-10 mt-14 flex max-w-lg flex-col gap-7 [@media(max-height:820px)]:mt-8 [@media(max-height:820px)]:gap-4'>
          <Badge
            variant='outline'
            className='w-fit gap-2 rounded-full border-border/70 bg-card/40 px-3 py-1 text-xs font-normal text-muted-foreground backdrop-blur'
          >
            <span className='relative flex size-1.5'>
              <span className='absolute inline-flex size-full animate-ping rounded-full bg-[#30a46c] opacity-75 motion-reduce:animate-none' />
              <span className='relative inline-flex size-1.5 rounded-full bg-[#30a46c]' />
            </span>
            AI Agent 已就绪
          </Badge>

          <div className='flex flex-col gap-4'>
            <h1 className='text-4xl leading-tight font-semibold tracking-tight text-balance [@media(max-height:820px)]:text-3xl'>
              {headline}
              <br />
              <span className='bg-linear-to-r from-[#a48fff] to-[#6e56cf] bg-clip-text text-transparent'>
                {highlight}
              </span>
            </h1>
            <p className='max-w-md text-sm leading-relaxed text-pretty text-muted-foreground'>
              {description}
            </p>
          </div>

          <div className='flex flex-wrap gap-2'>
            {features.map((item) => (
              <Badge
                key={item.title}
                variant='outline'
                className='gap-1.5 rounded-full border-border/70 bg-card/30 px-2.5 py-1 font-normal text-muted-foreground backdrop-blur'
              >
                <item.icon />
                {item.title}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* 右侧表单区 */}
      <div className='relative flex flex-col items-center justify-center overflow-hidden px-6 py-10 sm:px-8'>
        <div aria-hidden className='pointer-events-none absolute inset-0 -z-10'>
          <div className='absolute -top-24 right-0 size-96 rounded-full bg-[#6e56cf]/6 blur-[120px]' />
        </div>

        <div className='mb-8 flex items-center gap-2 lg:hidden'>
          <Logo className='size-6' />
          <span className='text-lg font-semibold tracking-tight'>
            WiseCloud AI
          </span>
        </div>

        <div className='w-full max-w-sm'>{children}</div>
      </div>
    </div>
  )
}
