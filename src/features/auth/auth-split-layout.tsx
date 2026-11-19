import { Check, Terminal } from 'lucide-react'
import { Logo } from '@/assets/logo'

const capabilities = [
  {
    index: '01',
    meta: 'Multi-Agent',
    title: '多智能体协作',
  },
  {
    index: '02',
    meta: 'Knowledge',
    title: '知识库增强',
  },
  {
    index: '03',
    meta: 'Workflow',
    title: '自动化工作流',
  },
]

const traceSteps = [
  {
    label: '解析任务意图',
    detail: 'intent.parse',
    cost: '0.2s',
    state: 'done',
  },
  {
    label: '检索知识库 · 命中 24 条',
    detail: 'retrieval.query',
    cost: '0.6s',
    state: 'done',
  },
  {
    label: '调用 MCP 工具 · CRM',
    detail: 'tool.call',
    cost: '1.1s',
    state: 'done',
  },
  {
    label: '生成执行计划，等待确认',
    detail: 'plan.ready',
    cost: '2.4s',
    state: 'active',
  },
] as const

const cornerTicks = [
  'left-5 top-5 border-l border-t',
  'right-5 top-5 border-r border-t',
  'left-5 bottom-5 border-l border-b',
  'right-5 bottom-5 border-r border-b',
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
    <div className='grid min-h-svh w-full lg:h-svh lg:grid-cols-[1.06fr_1fr]'>
      {/* 左侧：墨黑技术蓝图面板 */}
      <aside className='relative hidden overflow-hidden bg-[#07080c] text-[#f2efe8] lg:flex lg:flex-col lg:p-11 xl:p-14 [@media(max-height:800px)]:p-8'>
        {/* 背景层：暗紫辉光 + 细网格 + 控制台刻度环 + 颗粒质感 */}
        <div aria-hidden className='pointer-events-none absolute inset-0'>
          <div className='absolute inset-0 bg-[radial-gradient(85%_65%_at_100%_0%,rgba(110,86,207,0.18),transparent_62%)]' />
          <div className='absolute inset-0 bg-[linear-gradient(to_right,rgba(242,239,232,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(242,239,232,0.045)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_30%_32%,black,transparent_78%)] bg-size-[64px_64px]' />
          <div className='absolute -right-44 -bottom-56 size-[40rem] animate-[spin_90s_linear_infinite] rounded-full border border-dashed border-white/[0.07] motion-reduce:animate-none' />
          <div className='absolute -right-20 -bottom-36 size-[26rem] rounded-full border border-white/[0.06]' />
          <div className='absolute top-1/2 left-0 h-px w-full bg-white/[0.05]' />
          <div
            className='absolute inset-0 opacity-[0.05] mix-blend-overlay'
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E\")",
            }}
          />
        </div>

        {/* 蓝图定位角标 */}
        {cornerTicks.map((tick) => (
          <span
            key={tick}
            aria-hidden
            className={`absolute size-3 border-white/25 ${tick}`}
          />
        ))}

        {/* 竖向铭牌 */}
        <span className='absolute top-1/2 right-5 hidden -translate-y-1/2 font-mono text-[9px] tracking-[0.42em] text-white/25 uppercase [writing-mode:vertical-rl] xl:block'>
          WiseCloud · Intelligence Layer · 2026
        </span>

        {/* 品牌行 */}
        <header className='relative z-10 flex shrink-0 items-center justify-between gap-4'>
          <div className='flex items-center gap-2.5'>
            <span className='flex size-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.04]'>
              <Logo className='size-4.5' />
            </span>
            <span className='text-[15px] font-semibold tracking-tight'>
              WiseCloud AI
            </span>
          </div>
          <span className='flex items-center gap-2 font-mono text-[10px] tracking-[0.2em] text-white/35 uppercase'>
            <span className='size-1 rounded-full bg-[#7ce2a8]' />
            secure access
          </span>
        </header>

        {/* 主体 */}
        <div className='relative z-10 flex flex-1 flex-col justify-center gap-8 py-10 [@media(max-height:800px)]:gap-5 [@media(max-height:800px)]:py-5'>
          <div className='flex flex-col gap-5 [@media(max-height:800px)]:gap-4'>
            <p className='flex animate-[wc-rise_0.7s_cubic-bezier(0.22,1,0.36,1)_both] items-center gap-3 font-mono text-[10px] tracking-[0.24em] text-white/40 uppercase motion-reduce:animate-none'>
              <span className='text-[#a48fff]'>01</span>
              <span className='h-px w-8 bg-white/20' />
              智能工作台
            </p>

            <h1 className='animate-[wc-rise_0.8s_cubic-bezier(0.22,1,0.36,1)_0.08s_both] text-[2.5rem] leading-[1.22] font-semibold tracking-tight text-balance xl:text-[2.85rem] [@media(max-height:800px)]:text-[2.05rem]'>
              {headline}
              <br />
              <span className='text-[#c3b2ff]'>{highlight}</span>
            </h1>

            <p className='max-w-[26rem] animate-[wc-rise_0.8s_cubic-bezier(0.22,1,0.36,1)_0.16s_both] text-[13.5px] leading-relaxed text-pretty text-white/45 motion-reduce:animate-none'>
              {description}
            </p>
          </div>

          {/* Agent 执行轨迹 */}
          <div className='w-full max-w-[30rem] animate-[wc-rise_0.9s_cubic-bezier(0.22,1,0.36,1)_0.24s_both] overflow-hidden rounded-xl border border-white/10 bg-white/[0.028] shadow-[0_24px_60px_-32px_rgba(0,0,0,0.9)] backdrop-blur-sm motion-reduce:animate-none [@media(max-height:640px)]:hidden'>
            <div className='flex items-center justify-between border-b border-white/10 px-4 py-2.5'>
              <span className='flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-white/40 uppercase'>
                <Terminal className='size-3.5' />
                agent.run
              </span>
              <span className='flex items-center gap-1.5 font-mono text-[10px] tracking-[0.16em] text-[#7ce2a8] uppercase'>
                <span className='relative flex size-1.5'>
                  <span className='absolute inline-flex size-full animate-ping rounded-full bg-[#7ce2a8] opacity-70 motion-reduce:animate-none' />
                  <span className='relative inline-flex size-1.5 rounded-full bg-[#7ce2a8]' />
                </span>
                live
              </span>
            </div>

            <div>
              {traceSteps.map((step, index) => (
                <div
                  key={step.label}
                  className='flex animate-[wc-rise_0.6s_cubic-bezier(0.22,1,0.36,1)_both] items-center gap-3 border-b border-white/[0.055] px-4 py-2.5 motion-reduce:animate-none'
                  style={{ animationDelay: `${420 + index * 90}ms` }}
                >
                  <span className='font-mono text-[9.5px] text-white/25'>
                    {String(index + 1).padStart(2, '0')}
                  </span>
                  <span className='min-w-0 flex-1'>
                    <span className='block truncate text-[12.5px] leading-5 text-white/75'>
                      {step.label}
                    </span>
                    <span className='block font-mono text-[9.5px] tracking-[0.08em] text-white/30'>
                      {step.detail}
                    </span>
                  </span>
                  <span className='font-mono text-[10px] text-white/30'>
                    {step.cost}
                  </span>
                  {step.state === 'done' ? (
                    <Check
                      className='size-3.5 text-[#7ce2a8]'
                      strokeWidth={2}
                    />
                  ) : (
                    <span className='relative flex size-3.5 items-center justify-center'>
                      <span className='absolute size-1.5 animate-ping rounded-full bg-[#a48fff] opacity-60 motion-reduce:animate-none' />
                      <span className='size-1.5 rounded-full bg-[#a48fff]' />
                    </span>
                  )}
                </div>
              ))}
            </div>

            <div className='flex items-center justify-between px-4 py-2'>
              <span className='font-mono text-[9.5px] tracking-[0.18em] text-white/30 uppercase'>
                orchestration
              </span>
              <span className='font-mono text-[9.5px] tracking-[0.18em] text-white/30 uppercase'>
                4 / 4 nodes
              </span>
            </div>

            <div
              aria-hidden
              className='relative h-px w-full overflow-hidden bg-white/10'
            >
              <span className='absolute inset-y-0 left-0 w-1/3 animate-[wc-sweep_4.5s_ease-in-out_infinite] bg-linear-to-r from-transparent via-[#a48fff] to-transparent motion-reduce:hidden' />
            </div>
          </div>
        </div>

        {/* 能力清单 */}
        <footer className='relative z-10 flex shrink-0 items-end justify-between gap-6 border-t border-white/10 pt-5'>
          <div className='grid flex-1 grid-cols-3 gap-4'>
            {capabilities.map((item) => (
              <div key={item.index} className='flex flex-col gap-1.5'>
                <span className='font-mono text-[9.5px] tracking-[0.18em] text-white/30 uppercase'>
                  {item.index} / {item.meta}
                </span>
                <span className='text-[13px] tracking-tight text-white/75'>
                  {item.title}
                </span>
              </div>
            ))}
          </div>
          <span className='font-mono text-[10px] text-white/25'>
            © {new Date().getFullYear()}
          </span>
        </footer>
      </aside>

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
