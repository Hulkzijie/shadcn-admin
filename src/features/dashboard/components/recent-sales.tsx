import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

const orders = [
  {
    name: '王雨桐',
    email: 'wangyutong@wisecloud.cn',
    amount: '¥1,999.00',
    time: '2 分钟前',
    fallback: 'WY',
    avatar: '/avatars/01.png',
  },
  {
    name: '李泽宇',
    email: 'lizeyu@wisecloud.cn',
    amount: '¥39.00',
    time: '18 分钟前',
    fallback: 'LZ',
    avatar: '/avatars/02.png',
  },
  {
    name: '陈思远',
    email: 'chensiyuan@wisecloud.cn',
    amount: '¥299.00',
    time: '1 小时前',
    fallback: 'CS',
    avatar: '/avatars/03.png',
  },
  {
    name: '赵一诺',
    email: 'zhaoyinuo@wisecloud.cn',
    amount: '¥99.00',
    time: '3 小时前',
    fallback: 'ZY',
    avatar: '/avatars/04.png',
  },
  {
    name: '周可欣',
    email: 'zhoukexin@wisecloud.cn',
    amount: '¥39.00',
    time: '昨天 21:40',
    fallback: 'ZK',
    avatar: '/avatars/05.png',
  },
]

export function RecentSales() {
  return (
    <div className='flex flex-col gap-6'>
      {orders.map((order) => (
        <div key={order.email} className='flex items-center gap-3'>
          <Avatar className='size-9'>
            <AvatarImage src={order.avatar} alt={order.name} />
            <AvatarFallback>{order.fallback}</AvatarFallback>
          </Avatar>
          <div className='flex min-w-0 flex-1 flex-col gap-1'>
            <p className='truncate text-sm font-medium leading-none'>
              {order.name}
            </p>
            <p className='truncate text-xs text-muted-foreground'>
              {order.email}
            </p>
          </div>
          <div className='flex shrink-0 flex-col items-end gap-1'>
            <span className='text-sm font-medium tabular-nums'>
              {order.amount}
            </span>
            <span className='text-xs text-muted-foreground'>{order.time}</span>
          </div>
        </div>
      ))}
    </div>
  )
}
