import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type AxiosRequestConfig,
  type CreateAxiosDefaults,
  type InternalAxiosRequestConfig,
} from 'axios'
import { useAuthStore } from '@/stores/auth-store'
import { decryptResponse, encryptRequest } from './crypto'

type CreateApiClientOptions = CreateAxiosDefaults & {
  withAuth?: boolean
}

// 扩展 AxiosRequestConfig 以支持自定义加密标志
declare module 'axios' {
  interface AxiosRequestConfig {
    /** 是否对请求体进行加密（仅 Java 后端的部分接口需要） */
    encrypt?: boolean
  }
}

const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT ?? 30000)

/** 客户端 ID（对应后端 sys_client 表），所有请求都需携带，否则后端鉴权会返回 401 */
const CLIENT_ID =
  import.meta.env.VITE_APP_CLIENT_ID ?? 'e5cd7e4891bf95d1d19206ce24a7b32e'

export function createApiClient({
  withAuth = true,
  ...config
}: CreateApiClientOptions): AxiosInstance {
  const client = axios.create({
    timeout: DEFAULT_TIMEOUT,
    ...config,
  })

  // 请求拦截器：附加客户端标识 + Token + 加密请求体
  client.interceptors.request.use((requestConfig) => {
    const headers = AxiosHeaders.from(requestConfig.headers)

    // 1. 附加客户端标识（后端据此校验请求来源，缺失会返回 401）
    headers.set('clientid', CLIENT_ID)

    // 2. 附加认证 Token
    if (withAuth) {
      const accessToken = useAuthStore.getState().auth.accessToken
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`)
      }
    }
    requestConfig.headers = headers

    // 3. 接口加密（仅 POST/PUT 且显式标记 encrypt=true）
    if (
      requestConfig.encrypt &&
      (requestConfig.method?.toLowerCase() === 'post' ||
        requestConfig.method?.toLowerCase() === 'put') &&
      requestConfig.data !== undefined
    ) {
      const { headers: encryptHeaders, data } = encryptRequest(
        requestConfig.data
      )
      // 加密后请求体是字符串，axios 对 POST/PUT 会默认补 x-www-form-urlencoded，
      // 这里显式声明 JSON，避免后端报 Content-Type 不支持
      headers.set('Content-Type', 'application/json;charset=utf-8')
      Object.assign(requestConfig.headers, encryptHeaders)
      requestConfig.data = data
    }

    return requestConfig
  })

  // 响应拦截器：解密响应体（当响应头存在 encrypt-key 时）
  client.interceptors.response.use((response) => {
    const encryptKey = response.headers['encrypt-key'] as string | undefined
    if (encryptKey && typeof response.data === 'string') {
      try {
        response.data = decryptResponse(response.data, encryptKey)
        // 尝试解析为 JSON
        response.data = JSON.parse(response.data)
      } catch {
        // 解密失败或非 JSON，保持原始数据
      }
    }
    return response
  })

  return client
}

export type { AxiosRequestConfig, InternalAxiosRequestConfig }
