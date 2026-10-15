import { useCallback, useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn, MessageCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PasswordInput } from '@/components/password-input'
import { getCodeImg } from '@/features/auth/api/auth-api'

const formSchema = z.object({
  username: z.string().min(1, '请输入用户名'),
  password: z.string().min(1, '请输入密码').min(5, '密码至少 5 个字符'),
  code: z.string().optional(),
})

const smsSchema = z.object({
  phone: z.string().min(1, '请输入手机号'),
  smsCode: z.string().min(1, '请输入验证码'),
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
  const [countdown, setCountdown] = useState(0)
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

  const smsForm = useForm<z.infer<typeof smsSchema>>({
    resolver: zodResolver(smsSchema),
    defaultValues: {
      phone: '',
      smsCode: '',
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

  // 短信验证码倒计时
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

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

  // 发送短信验证码（功能待接入）
  async function onSendSmsCode() {
    const valid = await smsForm.trigger('phone')
    if (!valid) return
    setCountdown(60)
    toast.info('短信验证码功能开发中，敬请期待')
  }

  // 短信登录（功能待接入）
  function onSmsSubmit() {
    toast.info('短信登录功能开发中，敬请期待')
  }

  // 微信登录（功能待接入）
  function onWeChatLogin() {
    toast.info('微信登录功能开发中，敬请期待')
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <Tabs defaultValue='password'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='password'>密码登录</TabsTrigger>
            <TabsTrigger value='sms'>短信登录</TabsTrigger>
          </TabsList>

          {/* 密码登录 */}
          <TabsContent value='password' className='grid gap-3 pt-4'>
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
          </TabsContent>

          {/* 短信登录 */}
          <TabsContent value='sms' className='grid gap-3 pt-4'>
            <FormField
              control={smsForm.control}
              name='phone'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>手机号</FormLabel>
                  <FormControl>
                    <Input
                      inputMode='numeric'
                      placeholder='请输入手机号'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={smsForm.control}
              name='smsCode'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>短信验证码</FormLabel>
                  <div className='flex items-center gap-2'>
                    <FormControl>
                      <Input
                        placeholder='请输入验证码'
                        autoComplete='off'
                        {...field}
                      />
                    </FormControl>
                    <Button
                      type='button'
                      variant='outline'
                      className='shrink-0'
                      disabled={countdown > 0}
                      onClick={() => void onSendSmsCode()}
                    >
                      {countdown > 0 ? `${countdown}s` : '获取验证码'}
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type='button'
              className='mt-2'
              onClick={() => void onSmsSubmit()}
            >
              <LogIn />
              登录
            </Button>
          </TabsContent>
        </Tabs>

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

        <Button
          type='button'
          variant='outline'
          disabled={isLoading}
          onClick={onWeChatLogin}
        >
          <MessageCircle className='size-4 text-[#07c160]' />
          微信登录
        </Button>
      </form>
    </Form>
  )
}
