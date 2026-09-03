import { fileURLToPath, URL } from 'node:url'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // '@' path alias used across the app (e.g. import x from '@/lib/utils')
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});
