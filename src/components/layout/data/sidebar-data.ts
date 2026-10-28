import { AudioWaveform, Command, GalleryVerticalEnd } from 'lucide-react'
import { type SidebarData } from '../types'

/**
 * 侧边栏静态数据：仅保留顶部的团队切换和底部的用户信息。
 * 菜单项已改为由后端 GET /system/menu/getRouters 返回，见 use-menu-nav.ts。
 */
export const sidebarData: SidebarData = {
  user: {
    name: 'Admin',
    email: 'admin@wisecloud.si',
    avatar: '/avatars/shadcn.jpg',
  },
  teams: [
    {
      name: 'WiseCloud',
      logo: Command,
      plan: '智能云端管理平台',
    },
    {
      name: 'Acme Inc',
      logo: GalleryVerticalEnd,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: AudioWaveform,
      plan: 'Startup',
    },
  ],
}
