import { type SVGProps } from 'react'
import { cn } from '@/lib/utils'

/**
 * WiseCloud 品牌标识：
 * 云朵轮廓（Cloud）内嵌一枚实心四角火花（Wise / AI 智慧），
 * 采用 currentColor 描边与填充，可自适应深浅色背景。
 */
export function Logo({ className, ...props }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      id='wisecloud-logo'
      viewBox='0 0 24 24'
      xmlns='http://www.w3.org/2000/svg'
      height='24'
      width='24'
      fill='none'
      stroke='currentColor'
      strokeWidth='1.8'
      strokeLinecap='round'
      strokeLinejoin='round'
      className={cn('size-6', className)}
      {...props}
    >
      <title>WiseCloud</title>
      {/* 云朵外形 */}
      <path d='M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z' />
      {/* 云中智慧火花 */}
      <path
        d='M12 11.1Q12 13.8 14.7 13.8Q12 13.8 12 16.5Q12 13.8 9.3 13.8Q12 13.8 12 11.1Z'
        fill='currentColor'
        stroke='none'
      />
    </svg>
  )
}
