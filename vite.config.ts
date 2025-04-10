import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Ignore React TypeScript errors
      babel: {
        parserOpts: {
          plugins: ['typescript']
        }
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    mainFields: ['browser', 'module', 'main']
  },
  build: {
    // Disable type checking during build
    target: 'esnext',
    rollupOptions: {
      external: [
        'aws-sdk',
        'mock-aws-s3',
        'nock',
        '@mapbox/node-pre-gyp',
        // Removed axios from external since we need it in the frontend
      ],
    },
    minify: true,
    sourcemap: false,
    commonjsOptions: {
      transformMixedEsModules: true,
    }
  },
  esbuild: {
    // Ignore TypeScript errors during build
    logOverride: { 
      'this-is-undefined-in-esm': 'silent',
      'commonjs-variable-in-esm': 'silent'
    },
  },
  optimizeDeps: {
    include: [
      '@radix-ui/react-slot',
      '@radix-ui/react-dialog',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
      'uuid'
    ],
    exclude: ['@mapbox/node-pre-gyp', 'aws-sdk', 'mock-aws-s3', 'nock'],
  },
  server: {
    port: 5173,
    strictPort: false, // Allow fallback to next available port
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('proxy error', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Sending Request:', req.method, req.url);
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
            console.log('Received Response:', proxyRes.statusCode, req.url);
          });
        }
      },
    },
  },
  define: {
    'process.env': {},
  },
})
