import {
  Construction,
  LayoutDashboard,
  Monitor,
  Bug,
  ListTodo,
  FileX,
  HelpCircle,
  Lock,
  Bell,
  Package,
  Palette,
  ServerOff,
  Settings,
  Wrench,
  UserCog,
  UserX,
  Users,
  MessagesSquare,
  Bot,
  MessageCircleQuestion,
  Library,
  Store,
  ShieldCheck,
  ShieldUser,
  Building2,
  BookMarked,
  ListTree,
  Network,
  AudioWaveform,
  Command,
  GalleryVerticalEnd,
  Workflow,
} from 'lucide-react'
import { ClerkLogo } from '@/assets/clerk-logo'
import { type SidebarData } from '../types'

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
  navGroups: [
    {
      title: '常规',
      items: [
        {
          title: '仪表盘',
          url: '/',
          icon: LayoutDashboard,
        },
        {
          title: '任务',
          url: '/tasks',
          icon: ListTodo,
        },
        {
          title: '应用',
          url: '/apps',
          icon: Package,
        },
        {
          title: '聊天',
          url: '/chats',
          badge: '3',
          icon: MessagesSquare,
        },
        {
          title: 'AI 聊天',
          url: '/ai-chat',
          icon: Bot,
        },
        {
          title: '智能体',
          url: '/agents',
          icon: Workflow,
        },
        {
          title: '智能问答',
          url: '/qa',
          icon: MessageCircleQuestion,
        },
        {
          title: '知识库',
          url: '/knowledge-base',
          icon: Library,
        },
        {
          title: '应用广场',
          url: '/app-plaza',
          icon: Store,
        },
        {
          title: '用户',
          url: '/users',
          icon: Users,
        },
        {
          title: 'Clerk 认证',
          icon: ClerkLogo,
          items: [
            {
              title: '登录',
              url: '/clerk/sign-in',
            },
            {
              title: '注册',
              url: '/clerk/sign-up',
            },
            {
              title: '用户管理',
              url: '/clerk/user-management',
            },
          ],
        },
      ],
    },
    {
      title: '系统管理',
      items: [
        {
          title: '用户',
          url: '/system/users',
          icon: Users,
        },
        {
          title: '角色',
          url: '/system/roles',
          icon: ShieldUser,
        },
        {
          title: '菜单',
          url: '/system/menus',
          icon: ListTree,
        },
        {
          title: '部门',
          url: '/system/depts',
          icon: Network,
        },
        {
          title: '字典',
          url: '/system/dict/type',
          icon: BookMarked,
        },
        {
          title: '租户',
          url: '/system/tenants',
          icon: Building2,
        },
      ],
    },
    {
      title: '页面',
      items: [
        {
          title: '认证',
          icon: ShieldCheck,
          items: [
            {
              title: '登录',
              url: '/sign-in',
            },
            {
              title: '登录（双列）',
              url: '/sign-in-2',
            },
            {
              title: '注册',
              url: '/sign-up',
            },
            {
              title: '忘记密码',
              url: '/forgot-password',
            },
            {
              title: '验证码',
              url: '/otp',
            },
          ],
        },
        {
          title: '错误页',
          icon: Bug,
          items: [
            {
              title: '未授权',
              url: '/errors/unauthorized',
              icon: Lock,
            },
            {
              title: '禁止访问',
              url: '/errors/forbidden',
              icon: UserX,
            },
            {
              title: '页面不存在',
              url: '/errors/not-found',
              icon: FileX,
            },
            {
              title: '服务器内部错误',
              url: '/errors/internal-server-error',
              icon: ServerOff,
            },
            {
              title: '维护中',
              url: '/errors/maintenance-error',
              icon: Construction,
            },
          ],
        },
      ],
    },
    {
      title: '其他',
      items: [
        {
          title: '设置',
          icon: Settings,
          items: [
            {
              title: '个人资料',
              url: '/settings',
              icon: UserCog,
            },
            {
              title: '账号',
              url: '/settings/account',
              icon: Wrench,
            },
            {
              title: '外观',
              url: '/settings/appearance',
              icon: Palette,
            },
            {
              title: '通知',
              url: '/settings/notifications',
              icon: Bell,
            },
            {
              title: '显示',
              url: '/settings/display',
              icon: Monitor,
            },
          ],
        },
        {
          title: '帮助中心',
          url: '/help-center',
          icon: HelpCircle,
        },
      ],
    },
  ],
}
