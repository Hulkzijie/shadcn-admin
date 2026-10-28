import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Cloud,
  Database,
  Download,
  Eye,
  Plus,
  Server,
  ShieldAlert,
  Users,
  type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { TopNav } from '@/components/layout/top-nav'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { Analytics } from './components/analytics'
import { Overview } from './components/overview'
import { RecentSales } from './components/recent-sales'

const stats: StatCardProps[] = [
  {
    title: '今日访问量',
    description: '全站页面浏览量',
    value: '12,846',
    change: '12.5%',
    hint: '较昨日',
    trend: 'up',
    tone: 'positive',
    icon: Eye,
  },
  {
    title: '在线用户',
    description: '实时活跃连接数',
    value: '1,024',
    change: '5.2%',
    hint: '较上周',
    trend: 'up',
    tone: 'positive',
    icon: Users,
  },
  {
    title: '资源实例',
    description: '云主机与容器总数',
    value: '386',
    change: '18 台',
    hint: '本周新增',
    trend: 'up',
    tone: 'positive',
    icon: Server,
  },
  {
    title: '今日告警',
    description: '待处理安全事件',
    value: '12',
    change: '3 条',
    hint: '较昨日',
    trend: 'up',
    tone: 'negative',
    icon: ShieldAlert,
  },
]

const services: {
  name: string
  description: string
  status: '运行中' | '维护中'
  icon: LucideIcon
  usage: string
}[] = [
  {
    name: '云主机集群',
    description: '华东 · 华北 · 华南',
    status: '运行中',
    icon: Server,
    usage: 'CPU 42%',
  },
  {
    name: '关系型数据库',
    description: '主从热备 · 自动备份',
    status: '运行中',
    icon: Database,
    usage: '连接 68%',
  },
  {
    name: '对象存储',
    description: '标准存储 · 归档存储',
    status: '维护中',
    icon: Cloud,
    usage: '容量 76%',
  },
  {
    name: '边缘节点',
    description: '全球 128 个加速节点',
    status: '运行中',
    icon: Activity,
    usage: '命中 94%',
  },
]

export function Dashboard() {
  return (
    <>
      {/* ===== 顶部导航 ===== */}
      <Header>
        <TopNav links={topNav} className='me-auto' />
        <Search />
        <ThemeSwitch />
        <ConfigDrawer />
        <ProfileDropdown />
      </Header>

      {/* ===== 主体内容 ===== */}
      <Main>
        <div className='mb-6 flex flex-wrap items-end justify-between gap-4'>
          <div className='flex flex-col gap-1'>
            <h1 className='text-2xl font-bold tracking-tight'>工作台</h1>
            <p className='text-sm text-muted-foreground'>
              智能云端管理平台 · 实时掌握资源、流量与业务运行状态
            </p>
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline'>
              <Download />
              导出报表
            </Button>
            <Button>
              <Plus />
              新建资源
            </Button>
          </div>
        </div>

        <Tabs defaultValue='overview' className='flex flex-col gap-4'>
          <div className='w-full overflow-x-auto pb-1'>
            <TabsList>
              <TabsTrigger value='overview'>概览</TabsTrigger>
              <TabsTrigger value='analytics'>分析</TabsTrigger>
              <TabsTrigger value='reports' disabled>
                报表
              </TabsTrigger>
              <TabsTrigger value='notifications' disabled>
                通知
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value='overview' className='flex flex-col gap-4'>
            <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
              {stats.map((stat) => (
                <StatCard key={stat.title} {...stat} />
              ))}
            </div>

            <div className='grid grid-cols-1 gap-4 lg:grid-cols-7'>
              <Card className='col-span-1 lg:col-span-4'>
                <CardHeader>
                  <CardTitle>资源使用趋势</CardTitle>
                  <CardDescription>近 12 个月资源消耗（元）</CardDescription>
                </CardHeader>
                <CardContent className='ps-2'>
                  <Overview />
                </CardContent>
              </Card>
              <Card className='col-span-1 lg:col-span-3'>
                <CardHeader>
                  <CardTitle>最新订购</CardTitle>
                  <CardDescription>本月共 265 笔订购记录</CardDescription>
                </CardHeader>
                <CardContent>
                  <RecentSales />
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>服务运行状态</CardTitle>
                <CardDescription>核心服务实时健康度与资源占用</CardDescription>
              </CardHeader>
              <CardContent>
                <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
                  {services.map((service) => (
                    <div
                      key={service.name}
                      className='flex items-start gap-3 rounded-lg border p-3'
                    >
                      <div className='flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
                        <service.icon />
                      </div>
                      <div className='flex min-w-0 flex-col gap-1'>
                        <div className='flex items-center gap-2'>
                          <span className='truncate text-sm font-medium'>
                            {service.name}
                          </span>
                          <span
                            className={cn(
                              'size-1.5 shrink-0 rounded-full',
                              service.status === '运行中'
                                ? 'bg-primary'
                                : 'bg-muted-foreground'
                            )}
                          />
                          <span className='text-xs text-muted-foreground'>
                            {service.status}
                          </span>
                        </div>
                        <span className='truncate text-xs text-muted-foreground'>
                          {service.description}
                        </span>
                        <Badge variant='outline' className='mt-0.5'>
                          {service.usage}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value='analytics' className='flex flex-col gap-4'>
            <Analytics />
          </TabsContent>
        </Tabs>
      </Main>
    </>
  )
}

type StatCardProps = {
  title: string
  description: string
  value: string
  change: string
  hint: string
  trend: 'up' | 'down'
  tone: 'positive' | 'negative'
  icon: LucideIcon
}

function StatCard({
  title,
  description,
  value,
  change,
  hint,
  trend,
  tone,
  icon: Icon,
}: StatCardProps) {
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-sm font-medium'>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        <CardAction>
          <div className='flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground'>
            <Icon />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent className='flex flex-col gap-1.5'>
        <div className='text-2xl font-semibold tracking-tight tabular-nums'>
          {value}
        </div>
        <div className='flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground'>
          <span
            className={cn(
              'inline-flex items-center gap-0.5 font-medium',
              tone === 'positive' ? 'text-primary' : 'text-destructive'
            )}
          >
            <TrendIcon />
            {change}
          </span>
          <span>{hint}</span>
        </div>
      </CardContent>
    </Card>
  )
}

const topNav = [
  {
    title: '概览',
    href: 'dashboard/overview',
    isActive: true,
    disabled: false,
  },
  {
    title: '客户',
    href: 'dashboard/customers',
    isActive: false,
    disabled: true,
  },
  {
    title: '产品',
    href: 'dashboard/products',
    isActive: false,
    disabled: true,
  },
  {
    title: '设置',
    href: 'dashboard/settings',
    isActive: false,
    disabled: true,
  },
]
