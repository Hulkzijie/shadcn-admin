import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { IconFacebook, IconGithub } from '@/assets/brand-icons'
import { useAuthStore } from '@/stores/auth-store'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'
import { getCodeImg } from '@/features/auth/api/auth-api'

const formSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码').min(5, '密码至少 5 个字符'),
  code: z.string().optional(),
})

interface CaptchaState {
  enabled: boolean
  uuid: string
  img: string
}

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [captcha, setCaptcha] = useState<CaptchaState>({
    enabled: false,
    uuid: '',
    img: '',
  })
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      username: '',
      password: '',
      code: '',
    },
  })

  // 获取/刷新验证码
  const refreshCaptcha = useCallback(async () => {
    try {
      const res = await getCodeImg()
      const { captchaEnabled, uuid, img } = res.data.data
      setCaptcha({ enabled: captchaEnabled, uuid, img })
    } catch {
      // 获取失败时按未开启验证码处理，避免阻塞登录
      setCaptcha({ enabled: false, uuid: '', img: '' })
    }
  }, [])

  useEffect(() => {
    void refreshCaptcha()
  }, [refreshCaptcha])

  async function onSubmit(data: z.infer<typeof formSchema>) {
    if (captcha.enabled && !data.code) {
      form.setError('code', { message: '请输入验证码' })
      return
    }

    setIsLoading(true)
    try {
      await auth.login(data.username, data.password, data.code, captcha.uuid)
      toast.success(`欢迎回来，${data.username}！`)
      const targetPath = redirectTo || '/'
      navigate({ to: targetPath, replace: true })
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '登录失败，请重试'
      toast.error(message)
      // 登录失败后验证码已失效，清空并刷新
      form.setValue('code', '')
      await refreshCaptcha()
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='username'
          render={({ field }) => (
            <FormItem>
              <FormLabel>用户名</FormLabel>
              <FormControl>
                <Input placeholder='请输入用户名' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>密码</FormLabel>
              <FormControl>
                <PasswordInput placeholder='请输入密码' {...field} />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='absolute inset-e-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75'
              >
                忘记密码？
              </Link>
            </FormItem>
          )}
        />
        {captcha.enabled && (
          <FormField
            control={form.control}
            name='code'
            render={({ field }) => (
              <FormItem>
                <FormLabel>验证码</FormLabel>
                <div className='flex items-center gap-2'>
                  <FormControl>
                    <Input
                      placeholder='请输入验证码'
                      autoComplete='off'
                      {...field}
                    />
                  </FormControl>
                  <button
                    type='button'
                    onClick={() => void refreshCaptcha()}
                    className='group relative h-9 w-28 shrink-0 overflow-hidden rounded-md border'
                    title='点击刷新验证码'
                  >
                    <img
                      src={`data:image/png;base64,${captcha.img}`}
                      alt='验证码'
                      className='h-full w-full object-cover'
                    />
                    <span className='absolute inset-0 hidden items-center justify-center bg-background/70 group-hover:flex'>
                      <RefreshCw className='size-4' />
                    </span>
                  </button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          登录
        </Button>

        <div className='relative my-2'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background px-2 text-muted-foreground'>
              其他登录方式
            </span>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-2'>
          <Button variant='outline' type='button' disabled={isLoading}>
            <IconGithub className='h-4 w-4' /> GitHub
          </Button>
          <Button variant='outline' type='button' disabled={isLoading}>
            <IconFacebook className='h-4 w-4' /> Facebook
          </Button>
        </div>
      </form>
    </Form>
  )
}
