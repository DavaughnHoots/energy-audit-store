import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    // Exclude problematic Node.js modules
    mainFields: ['browser', 'module', 'main'],
    modules: ['node_modules'],
  },
  build: {
    rollupOptions: {
      external: [
        'aws-sdk',
        'mock-aws-s3',
        'nock',
        '@mapbox/node-pre-gyp',
      ],
    },
  },
  optimizeDeps: {
    exclude: ['@mapbox/node-pre-gyp', 'aws-sdk', 'mock-aws-s3', 'nock'],
  },
  server: {
    port: 5173,
    proxy: {
      // Proxy API requests to backend
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  define: {
    // Define global variables if needed
    'process.env': {},
  },
})