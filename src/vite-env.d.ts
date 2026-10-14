/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  /** Java（Spring）后端前缀，默认 /java-api */
  readonly VITE_JAVA_API?: string
  /** FastAPI（Python）后端前缀，默认 /py-api */
  readonly VITE_FASTAPI_API?: string
  /** 请求超时时间（毫秒），默认 30000 */
  readonly VITE_API_TIMEOUT?: string

  // ===== RuoYi-Vue-Plus 后端配置 =====
  /** 接口加密开关 */
  readonly VITE_APP_ENCRYPT?: string
  /** RSA 公钥（加密请求） */
  readonly VITE_APP_RSA_PUBLIC_KEY?: string
  /** RSA 私钥（解密响应） */
  readonly VITE_APP_RSA_PRIVATE_KEY?: string
  /** 客户端 ID */
  readonly VITE_APP_CLIENT_ID?: string
  /** 默认租户 ID */
  readonly VITE_APP_TENANT_ID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
