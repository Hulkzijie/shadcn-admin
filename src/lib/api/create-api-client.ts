import axios, {
  AxiosHeaders,
  type AxiosInstance,
  type CreateAxiosDefaults,
} from 'axios'
import { useAuthStore } from '@/stores/auth-store'

type CreateApiClientOptions = CreateAxiosDefaults & {
  withAuth?: boolean
}

const DEFAULT_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT ?? 30000)

export function createApiClient({
  withAuth = true,
  ...config
}: CreateApiClientOptions): AxiosInstance {
  const client = axios.create({
    timeout: DEFAULT_TIMEOUT,
    ...config,
  })

  client.interceptors.request.use((requestConfig) => {
    if (!withAuth) return requestConfig

    const accessToken = useAuthStore.getState().auth.accessToken
    if (!accessToken) return requestConfig

    const headers = AxiosHeaders.from(requestConfig.headers)
    headers.set('Authorization', `Bearer ${accessToken}`)
    requestConfig.headers = headers

    return requestConfig
  })

  return client
}
