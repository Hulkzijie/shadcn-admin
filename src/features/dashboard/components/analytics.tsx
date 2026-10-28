import { CornerDownRight, MousePointerClick, Timer, Users } from 'lucide-react'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AnalyticsChart } from './analytics-chart'

const metrics = [
  {
    title: '总点击量',
    value: '1,248',
    change: '+12.4%',
    hint: '较上周',
    icon: MousePointerClick,
  },
  {
    title: '独立访客',
    value: '832',
    change: '+5.8%',
    hint: '较上周',
    icon: Users,
  },
  {
    title: '跳出率',
    value: '42%',
    change: '-3.2%',
    hint: '较上周',
    icon: CornerDownRight,
  },
  {
    title: '平均停留时长',
    value: '3 分 24 秒',
    change: '+18 秒',
    hint: '较上周',
    icon: Timer,
  },
]

export function Analytics() {
  return (
    <div className='flex flex-col gap-4'>
      <Card>
        <CardHeader>
          <CardTitle>流量概览</CardTitle>
          <CardDescription>近 7 天点击量与独立访客趋势</CardDescription>
        </CardHeader>
        <CardContent className='px-6'>
          <AnalyticsChart />
        </CardContent>
      </Card>
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {metrics.map((metric) => (
          <Card key={metric.title}>
            <CardHeader>
              <CardTitle className='text-sm font-medium'>
                {metric.title}
              </CardTitle>
              <CardAction>
                <div className='flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
                  <metric.icon />
                </div>
              </CardAction>
            </CardHeader>
            <CardContent className='flex flex-col gap-1.5'>
              <div className='text-2xl font-semibold tracking-tight tabular-nums'>
                {metric.value}
              </div>
              <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
                <span className='font-medium text-primary'>{metric.change}</span>
                <span>{metric.hint}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
        <Card className='col-span-1 lg:col-span-4'>
          <CardHeader>
            <CardTitle>来源分布</CardTitle>
            <CardDescription>带来访问的主要渠道</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={[
                { name: '直接访问', value: 512 },
                { name: '产品公测页', value: 238 },
                { name: '社交媒体', value: 174 },
                { name: '技术博客', value: 104 },
              ]}
              barClass='bg-primary'
              valueFormatter={(n) => `${n}`}
            />
          </CardContent>
        </Card>
        <Card className='col-span-1 lg:col-span-3'>
          <CardHeader>
            <CardTitle>终端分布</CardTitle>
            <CardDescription>用户访问设备占比</CardDescription>
          </CardHeader>
          <CardContent>
            <SimpleBarList
              items={[
                { name: '桌面端', value: 74 },
                { name: '移动端', value: 22 },
                { name: '平板', value: 4 },
              ]}
              barClass='bg-muted-foreground'
              valueFormatter={(n) => `${n}%`}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function SimpleBarList({
  items,
  valueFormatter,
  barClass,
}: {
  items: { name: string; value: number }[]
  valueFormatter: (n: number) => string
  barClass: string
}) {
  const max = Math.max(...items.map((i) => i.value), 1)
  return (
    <ul className='flex flex-col gap-3'>
      {items.map((i) => {
        const width = `${Math.round((i.value / max) * 100)}%`
        return (
          <li key={i.name} className='flex items-center justify-between gap-3'>
            <div className='min-w-0 flex-1'>
              <div className='mb-1 truncate text-xs text-muted-foreground'>
                {i.name}
              </div>
              <div className='h-2.5 w-full rounded-full bg-muted'>
                <div
                  className={`h-2.5 rounded-full ${barClass}`}
                  style={{ width }}
                />
              </div>
            </div>
            <div className='ps-2 text-xs font-medium tabular-nums'>
              {valueFormatter(i.value)}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
