import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
  },
  resolve: {
    alias: {
      process: 'process/browser',
      util: 'util',
      events: 'events',
      stream: 'stream-browserify',
      buffer: 'buffer',
    },
  },
  define: {
    'process.env': {},
    global: 'globalThis',
    Buffer: ['buffer', 'Buffer'],
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    },
    include: [
      'buffer',
      'process/browser',
      'util',
      'events',
      'stream-browserify',
    ],
    exclude: ['@uniswap/widgets/locales/en-US']
  }
})
