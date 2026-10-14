import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'
import {
  getInfo,
  login as loginApi,
  logout as logoutApi,
  type UserInfoVo,
} from '@/features/auth/api/auth-api'

const ACCESS_TOKEN = 'thisisjustarandomstring'

interface AuthUser {
  userId: number
  userName: string
  nickName: string
  email: string
  roles: string[]
  permissions: string[]
  avatar: string
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    setAccessToken: (accessToken: string) => void
    resetAccessToken: () => void
    reset: () => void
    /** 登录并获取用户信息 */
    login: (
      username: string,
      password: string,
      code?: string,
      uuid?: string
    ) => Promise<void>
    /** 拉取并保存当前登录用户信息（用于刷新页面后重建） */
    getUserInfo: () => Promise<void>
    /** 退出登录 */
    logout: () => Promise<void>
    /** 是否已登录 */
    isAuthenticated: () => boolean
  }
}

export const useAuthStore = create<AuthState>()((set, get) => {
  const cookieState = getCookie(ACCESS_TOKEN)
  const initToken = cookieState ? JSON.parse(cookieState) : ''
  return {
    auth: {
      user: null,
      accessToken: initToken,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      setAccessToken: (accessToken) =>
        set((state) => {
          setCookie(ACCESS_TOKEN, JSON.stringify(accessToken))
          return { ...state, auth: { ...state.auth, accessToken } }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return { ...state, auth: { ...state.auth, accessToken: '' } }
        }),
      reset: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return {
            ...state,
            auth: { ...state.auth, user: null, accessToken: '' },
          }
        }),

      isAuthenticated: () => {
        return !!get().auth.accessToken
      },

      getUserInfo: async () => {
        const res = await getInfo()
        if (res.data.code !== 200) {
          throw new Error(res.data.msg || '获取用户信息失败')
        }
        const info: UserInfoVo = res.data.data
        get().auth.setUser({
          userId: info.user.userId,
          userName: info.user.userName,
          nickName: info.user.nickName,
          email: info.user.email,
          roles: info.roles,
          permissions: info.permissions,
          avatar: info.user.avatar,
        })
      },

      login: async (username, password, code, uuid) => {
        // 1. 调用登录接口
        const res = await loginApi({ username, password, code, uuid })
        // RuoYi 业务错误以 HTTP 200 + 非 200 code 返回，需手动判断
        if (res.data.code !== 200) {
          throw new Error(res.data.msg || '登录失败')
        }
        const { access_token } = res.data.data

        // 2. 保存 Token
        get().auth.setAccessToken(access_token)

        // 3. 获取并保存用户信息（权限、角色）
        await get().auth.getUserInfo()
      },

      logout: async () => {
        try {
          await logoutApi()
        } finally {
          get().auth.reset()
        }
      },
    },
  }
})
