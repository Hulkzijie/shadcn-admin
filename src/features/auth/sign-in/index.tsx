import { Link, useSearch } from '@tanstack/react-router'
import { AuthSplitLayout } from '../auth-split-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthSplitLayout
      headline='与 AI Agent 一起'
      highlight='重塑你的工作方式'
      description='一个平台连接你的模型、知识与工具，让智能体替你完成从问答到自动执行的每一步。'
    >
      <div className='mb-6 space-y-1.5 text-center lg:text-start'>
        <h2 className='text-2xl font-semibold tracking-tight'>欢迎回来</h2>
        <p className='text-sm text-muted-foreground'>
          还没有账户？{' '}
          <Link
            to='/sign-up'
            className='font-medium text-foreground underline underline-offset-4'
          >
            立即注册
          </Link>
        </p>
      </div>

      <UserAuthForm redirectTo={redirect} />

      <p className='mt-6 text-center text-xs text-muted-foreground'>
        登录即表示你同意我们的{' '}
        <a
          href='/terms'
          className='underline underline-offset-4 hover:text-foreground'
        >
          服务条款
        </a>{' '}
        与{' '}
        <a
          href='/privacy'
          className='underline underline-offset-4 hover:text-foreground'
        >
          隐私政策
        </a>
      </p>
    </AuthSplitLayout>
  )
}
