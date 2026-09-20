/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLERK_PUBLISHABLE_KEY: string
  /** Java（Spring）后端前缀，默认 /java-api */
  readonly VITE_JAVA_API?: string
  /** FastAPI（Python）后端前缀，默认 /py-api */
  readonly VITE_FASTAPI_API?: string
  /** 请求超时时间（毫秒），默认 30000 */
  readonly VITE_API_TIMEOUT?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
