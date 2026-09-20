import { createApiClient } from './create-api-client'

/**
 * Java（Spring）后端实例，用于登录、权限、业务接口。
 * 开发环境经 Vite proxy 把 /java-api 转发到本地 Java 服务；
 * 生产环境由 Nginx / 网关做同样的前缀转发。
 */
export const javaClient = createApiClient({
  baseURL: import.meta.env.VITE_JAVA_API ?? '/java-api',
})
