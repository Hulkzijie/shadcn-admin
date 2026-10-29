/// <reference types="vitest/config" />
import path from 'path'
import { defineConfig, loadEnv, type ProxyOptions } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { tanstackRouter } from '@tanstack/router-plugin/vite'
import { playwright } from '@vitest/browser-playwright'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  // 后端代理目标：本地开发默认指向本机，可通过 .env 改为远程服务器地址
  const javaTarget = env.VITE_JAVA_API_TARGET || 'http://127.0.0.1:8080'
  const fastapiTarget = env.VITE_FASTAPI_API_TARGET || 'http://127.0.0.1:8000'

  // 本地没有自建瓦片服务时，开发代理直连天地图（.env 配 VITE_TIANDITU_TK 后生效）
  const tiandituTk = env.VITE_TIANDITU_TK
  const tiandituRewrite =
    (layer: string) =>
    (p: string): string => {
      const m = /^\/(?:map|anno)\/(\d+)\/(\d+)\/(\d+)\.png$/.exec(p)
      if (!m) return p
      const [, z, x, y] = m
      return `/${layer}_w/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=${layer}&STYLE=default&TILEMATRIXSET=w&FORMAT=tiles&TILEMATRIX=${z}&TILEROW=${y}&TILECOL=${x}&tk=${tiandituTk}`
    }
  const tileProxy: Record<string, string | ProxyOptions> = tiandituTk
    ? {
        '/map': {
          target: 'https://t0.tianditu.gov.cn',
          changeOrigin: true,
          rewrite: tiandituRewrite('vec'),
        },
        '/anno': {
          target: 'https://t0.tianditu.gov.cn',
          changeOrigin: true,
          rewrite: tiandituRewrite('cva'),
        },
      }
    : {}

  return {
    server: {
      port: 9100,
      proxy: {
        '/java-api': {
          target: javaTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/java-api/, ''),
        },
        '/py-api': {
          target: fastapiTarget,
          changeOrigin: true,
          rewrite: (p) => p.replace(/^\/py-api/, ''),
        },
        ...tileProxy,
      },
    },
    plugins: [
      tanstackRouter({
        target: 'react',
        autoCodeSplitting: true,
      }),
      react(),
      tailwindcss(),
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      silent: 'passed-only',
      unstubEnvs: true,
      browser: {
        enabled: true,
        provider: playwright(),
        instances: [{ browser: 'chromium' }],
      },
      coverage: {
        // include: ['src/**/*.{js,jsx,ts,tsx}'], // Uncomment to expand the report to all src/**/* so untested modules appear as 0% coverage.
        exclude: [
          'src/components/ui/**',
          'src/assets/**',
          'src/tanstack-table.d.ts',
          'src/routeTree.gen.ts',
          'src/test-utils/**',
          'src/routes/**',
        ],
      },
    },
  }
})
