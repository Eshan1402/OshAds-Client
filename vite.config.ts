import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Not PORT: hosts and dev tools set PORT for Vite itself, which would proxy the API back into Vite.
  const server = env.API_TARGET ?? 'http://127.0.0.1:8788'
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      // API, login and traffic counter run in server/index.ts (npm run server).
      // changeOrigin off keeps the browser's Host, which the server's cross-site check compares with Origin.
      proxy: { '/api': { target: server, changeOrigin: false } },
    },
    build: {
      target: 'es2022',
      // three.js is only loaded lazily for the desktop hero, so its size doesn't affect first paint.
      chunkSizeWarningLimit: 1000,
    },
  }
})
