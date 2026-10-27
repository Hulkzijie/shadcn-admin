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

  // ===== GIS =====
  /** 完整底图样式地址（style.json），优先级最高；配置后忽略下面的瓦片模板 */
  readonly VITE_MAP_STYLE_URL?: string
  /** 底图瓦片模板，需含 {z}/{x}/{y}，例如 /map/{z}/{x}/{y}.png */
  readonly VITE_MAP_TILE_URL?: string
  /** 注记（文字标注）瓦片模板，可选；留空则只有无标注底图 */
  readonly VITE_MAP_LABEL_TILE_URL?: string
  /** 底图最大原生层级，超出后自动拉伸，默认 18 */
  readonly VITE_MAP_TILE_MAX_ZOOM?: string
  /** 底图版权信息，默认 © 天地图 */
  readonly VITE_MAP_TILE_ATTRIBUTION?: string
  /** 坐标系：WGS84 | GCJ02 | CGCS2000（必须与后端数据一致） */
  readonly VITE_GIS_CRS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
