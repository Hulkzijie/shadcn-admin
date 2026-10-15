import { Link } from '@tanstack/react-router'
import { AuthSplitLayout } from '../auth-split-layout'
import { SignUpForm } from './components/sign-up-form'

export function SignUp() {
  return (
    <AuthSplitLayout
      headline='创建你的账户'
      highlight='开启智能体之旅'
      description='注册 WiseCloud AI，连接你的模型、知识与工具，让 AI Agent 为你工作。'
    >
      <div className='mb-6 space-y-1.5 text-center lg:text-start'>
        <h2 className='text-2xl font-semibold tracking-tight'>创建账户</h2>
        <p className='text-sm text-muted-foreground'>
          已有账户？{' '}
          <Link
            to='/sign-in'
            className='font-medium text-foreground underline underline-offset-4'
          >
            立即登录
          </Link>
        </p>
      </div>

      <SignUpForm />

      <p className='mt-6 text-center text-xs text-muted-foreground'>
        注册即表示你同意我们的{' '}
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
