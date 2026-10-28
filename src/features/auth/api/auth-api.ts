import { javaClient } from '@/lib/api/java-client'

/**
 * RuoYi-Vue-Plus 统一响应结构
 */
export interface RuoYiResponse<T = unknown> {
  code: number
  msg: string
  data: T
}

/**
 * 登录请求参数
 */
export interface LoginBody {
  username: string
  password: string
  /** 验证码（开启验证码时需要） */
  code?: string
  /** 验证码唯一标识 */
  uuid?: string
  /** 客户端 ID */
  clientId?: string
  /** 授权类型：password / email / sms / social / xcx */
  grantType?: string
  /** 租户 ID（多租户模式下需要） */
  tenantId?: string
}

/**
 * 登录响应
 */
export interface LoginVo {
  access_token: string
  refresh_token: string
  expire_in: number
  refresh_expire_in: number
  client_id: string
  scope: string
  openid?: string
}

/**
 * 用户信息响应
 */
export interface UserInfoVo {
  user: {
    userId: number
    tenantId: string
    deptId: number
    userName: string
    nickName: string
    email: string
    phonenumber: string
    sex: string
    avatar: string
    status: string
    userType: string
  }
  /** 权限标识数组，如 ['system:user:list', 'system:role:list'] */
  permissions: string[]
  /** 角色标识数组，如 ['admin'] */
  roles: string[]
}

/**
 * 路由菜单（getRouters 返回）
 */
export interface RouterVo {
  name: string
  path: string
  hidden: boolean
  redirect?: string
  component?: string
  alwaysShow?: boolean
  meta: {
    title: string
    icon: string
    noCache: boolean
    link?: string
  }
  children?: RouterVo[]
}

/** 客户端 ID（对应后端 sys_client 表） */
const CLIENT_ID =
  import.meta.env.VITE_APP_CLIENT_ID ?? 'e5cd7e4891bf95d1d19206ce24a7b32e'

/** 默认租户 ID */
const TENANT_ID = import.meta.env.VITE_APP_TENANT_ID ?? '000000'

/**
 * 登录
 */
export function login(data: LoginBody) {
  return javaClient.request<RuoYiResponse<LoginVo>>({
    url: '/auth/login',
    method: 'post',
    encrypt: true,
    data: {
      ...data,
      clientId: data.clientId ?? CLIENT_ID,
      grantType: data.grantType ?? 'password',
      tenantId: data.tenantId ?? TENANT_ID,
    },
  })
}

/**
 * 退出登录
 */
export function logout() {
  return javaClient.request<RuoYiResponse<void>>({
    url: '/auth/logout',
    method: 'post',
  })
}

/**
 * 获取用户信息（含权限标识和角色标识）
 */
export function getInfo() {
  return javaClient.request<RuoYiResponse<UserInfoVo>>({
    url: '/system/user/getInfo',
    method: 'get',
  })
}

/**
 * 获取动态路由菜单
 */
export function getRouters() {
  return javaClient.request<RuoYiResponse<RouterVo[]>>({
    url: '/system/menu/getRouters',
    method: 'get',
  })
}

/**
 * 获取验证码
 */
export function getCodeImg() {
  return javaClient.request<
    RuoYiResponse<{
      captchaEnabled: boolean
      uuid: string
      img: string
    }>
  >({
    url: '/auth/code',
    method: 'get',
  })
}

/**
 * 获取租户列表
 */
export function getTenantList() {
  return javaClient.request<
    RuoYiResponse<{
      tenantEnabled: boolean
      voList: Array<{ tenantId: string; companyName: string; domain: string }>
    }>
  >({
    url: '/auth/tenant/list',
    method: 'get',
  })
}
