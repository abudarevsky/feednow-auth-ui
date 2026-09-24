import path from 'node:path'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { createApiProxy } from './src/lib/dev-proxy.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.join(import.meta.dirname, './src'),
    },
  },
  server: {
    port: 3000,
    proxy: createApiProxy(process.env.FEEDNOW_AUTH_ORIGIN ?? 'http://127.0.0.1:8000'),
  },
  preview: {
    port: 4173,
    strictPort: true,
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    // Unit/component tests live under src/; e2e/ belongs to Playwright.
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
})
