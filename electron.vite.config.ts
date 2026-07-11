import { resolve } from 'node:path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  main: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: resolve('src/main/main.ts')
      }
    }
  },
  preload: {
    resolve: {
      alias: {
        '@shared': resolve('src/shared')
      }
    },
    plugins: [externalizeDepsPlugin()],
    build: {
      rollupOptions: {
        input: resolve('src/preload/preload.ts')
      }
    }
  },
  renderer: {
    root: 'src/renderer',
    resolve: {
      alias: {
        '@shared': resolve('src/shared'),
        '@': resolve('src/renderer/src')
      }
    },
    plugins: [react()],
    server: {
      // На части систем `localhost` резолвится в ::1 (IPv6) раньше, чем в
      // 127.0.0.1, а Vite слушает только IPv4 — Electron получает
      // ERR_CONNECTION_REFUSED, хотя сервер реально поднят. Слушаем и
      // адресуемся строго по IPv4, чтобы резолвинг не участвовал вообще.
      host: '127.0.0.1'
    },
    build: {
      rollupOptions: {
        input: resolve('src/renderer/index.html')
      }
    }
  }
})
