import { createApiClient } from './create-api-client'

/**
 * FastAPI（Python）后端实例。
 * 开发环境经 Vite proxy 把 /py-api 转发到本地 FastAPI；
 * 生产环境由 Nginx / 网关做同样的前缀转发。
 */
export const fastapiClient = createApiClient({
  baseURL: import.meta.env.VITE_FASTAPI_API ?? '/py-api',
})
