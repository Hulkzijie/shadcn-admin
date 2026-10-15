import { useEffect, useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, UserPlus } from 'lucide-react'
import { toast } from 'sonner'
import { sleep, cn } from '@/lib/utils'
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

const emailSchema = z
  .object({
    email: z.email({
      error: (iss) => (iss.input === '' ? '请输入邮箱' : undefined),
    }),
    password: z.string().min(1, '请输入密码').min(7, '密码至少 7 个字符'),
    confirmPassword: z.string().min(1, '请再次输入密码'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  })

const phoneSchema = z
  .object({
    phone: z.string().min(1, '请输入手机号'),
    smsCode: z.string().min(1, '请输入验证码'),
    password: z.string().min(1, '请输入密码').min(7, '密码至少 7 个字符'),
    confirmPassword: z.string().min(1, '请再次输入密码'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次输入的密码不一致',
    path: ['confirmPassword'],
  })

export function SignUpForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const form = useForm<z.infer<typeof emailSchema>>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  const phoneForm = useForm<z.infer<typeof phoneSchema>>({
    resolver: zodResolver(phoneSchema),
    defaultValues: {
      phone: '',
      smsCode: '',
      password: '',
      confirmPassword: '',
    },
  })

  // 短信验证码倒计时
  useEffect(() => {
    if (countdown <= 0) return
    const timer = setTimeout(() => setCountdown((value) => value - 1), 1000)
    return () => clearTimeout(timer)
  }, [countdown])

  function onSubmit(data: z.infer<typeof emailSchema>) {
    setIsLoading(true)

    toast.promise(sleep(2000), {
      loading: '正在创建账户...',
      success: () => {
        setIsLoading(false)
        return `账户已创建：${data.email}`
      },
      error: '注册失败',
    })
  }

  // 发送短信验证码（功能待接入）
  async function onSendSmsCode() {
    const valid = await phoneForm.trigger('phone')
    if (!valid) return
    setCountdown(60)
    toast.info('短信验证码功能开发中，敬请期待')
  }

  // 手机号注册（功能待接入）
  function onPhoneSubmit() {
    toast.info('手机号注册功能开发中，敬请期待')
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <Tabs defaultValue='email'>
          <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value='email'>邮箱注册</TabsTrigger>
            <TabsTrigger value='phone'>手机号注册</TabsTrigger>
          </TabsList>

          {/* 邮箱注册 */}
          <TabsContent value='email' className='grid gap-3 pt-4'>
            <FormField
              control={form.control}
              name='email'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>邮箱</FormLabel>
                  <FormControl>
                    <Input placeholder='name@example.com' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder='********' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>确认密码</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder='********' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className='mt-2' disabled={isLoading}>
              {isLoading ? <Loader2 className='animate-spin' /> : <UserPlus />}
              注册
            </Button>
          </TabsContent>

          {/* 手机号注册 */}
          <TabsContent value='phone' className='grid gap-3 pt-4'>
            <FormField
              control={phoneForm.control}
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
              control={phoneForm.control}
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
            <FormField
              control={phoneForm.control}
              name='password'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>密码</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder='********' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={phoneForm.control}
              name='confirmPassword'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>确认密码</FormLabel>
                  <FormControl>
                    <PasswordInput placeholder='********' {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type='button'
              className='mt-2'
              onClick={() => void onPhoneSubmit()}
            >
              <UserPlus />
              注册
            </Button>
          </TabsContent>
        </Tabs>
      </form>
    </Form>
  )
}
