import { Bot, Sparkles, Workflow } from 'lucide-react'
import { Logo } from '@/assets/logo'

const features = [
  {
    icon: Bot,
    title: '多智能体协作',
    desc: '编排多个 AI Agent 协同完成复杂任务',
  },
  {
    icon: Sparkles,
    title: '知识库增强',
    desc: '基于私有知识库的精准检索与内容生成',
  },
  {
    icon: Workflow,
    title: '自动化工作流',
    desc: '可视化编排流程，让重复工作自动运行',
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
    <div className='grid min-h-svh w-full lg:grid-cols-2'>
      {/* 左侧品牌 & 产品叙事 */}
      <div className='relative hidden overflow-hidden bg-[#111113] lg:flex lg:flex-col lg:justify-between lg:border-r lg:border-white/[0.07] lg:p-12'>
        {/* 背景：柔和径向高光 + 极淡网格 */}
        <div aria-hidden className='pointer-events-none absolute inset-0'>
          <div className='absolute inset-x-0 top-0 h-105 bg-[radial-gradient(70%_100%_at_50%_0%,rgba(110,86,207,0.20),transparent_70%)]' />
          <div className='absolute -top-24 -left-16 size-128 animate-[float_18s_ease-in-out_infinite] rounded-full bg-[#6e56cf]/10 blur-[140px]' />
          <div className='absolute -right-24 bottom-0 size-112 animate-[float_20s_ease-in-out_infinite_2s] rounded-full bg-[#0091ff]/10 blur-[140px]' />
          <div className='absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.045)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_center,black,transparent_75%)] bg-size-[56px_56px]' />
        </div>

        <div className='relative z-10 flex items-center gap-2 text-white'>
          <Logo className='size-7' />
          <span className='text-lg font-semibold tracking-tight'>
            WiseCloud AI
          </span>
        </div>

        <div className='relative z-10 max-w-md space-y-6'>
          <div className='inline-flex items-center gap-2 rounded-full border border-white/8 bg-white/4 px-3 py-1 text-xs text-[#b0b4ba] backdrop-blur'>
            <span className='relative flex size-1.5'>
              <span className='absolute inline-flex size-full animate-ping rounded-full bg-[#30a46c] opacity-75' />
              <span className='relative inline-flex size-1.5 rounded-full bg-[#30a46c]' />
            </span>
            AI Agent 已就绪
          </div>

          <h1 className='text-4xl leading-tight font-semibold tracking-tight text-[#eeeeef]'>
            {headline}
            <br />
            <span className='bg-linear-to-r from-[#a48fff] to-[#6e56cf] bg-clip-text text-transparent'>
              {highlight}
            </span>
          </h1>

          <p className='text-sm leading-relaxed text-[#b0b4ba]'>{description}</p>

          <ul className='space-y-4 pt-2'>
            {features.map((item) => (
              <li key={item.title} className='flex items-start gap-3'>
                <span className='mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/8 bg-white/4 text-[#b0b4ba]'>
                  <item.icon className='size-4' />
                </span>
                <div>
                  <p className='text-sm font-medium text-[#eeeeef]'>
                    {item.title}
                  </p>
                  <p className='text-xs text-[#8b8d98]'>{item.desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className='relative z-10 text-xs text-[#6f737b]'>
          © {new Date().getFullYear()} WiseCloud AI · 智能体协作平台
        </p>
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
