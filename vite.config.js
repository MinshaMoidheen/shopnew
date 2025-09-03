import fs from 'fs'
import path from 'path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

export default defineConfig({
  plugins: [
    react(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
    })
  ],
  define: {
    global: 'globalThis'
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'https://pixinvent.com/',
        changeOrigin: true,
        secure: false
      }
    },
    cors: {
      origin: ['https://pixinvent.com', 'http://localhost:3000'],
      methods: ['GET', 'PATCH', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }
  },
  css: {
    preprocessorOptions: {
      scss: {
        includePaths: ['node_modules', './src/assets']
      }
    },
    postcss: {
      plugins: [require('postcss-rtl')()]
    }
  },
  resolve: {
    alias: [
      {
        find: /^~(.+)/,
        replacement: (_, p1) => p1
      },
      { find: '@src', replacement: path.resolve(__dirname, 'src') },
      { find: '@store', replacement: path.resolve(__dirname, 'src/slices') },
      { find: '@configs', replacement: path.resolve(__dirname, 'src/configs') },
      { find: '@styles', replacement: path.resolve(__dirname, 'src/@core/scss') },
      { find: '@utils', replacement: path.resolve(__dirname, 'src/utility/Utils') },
      { find: '@hooks', replacement: path.resolve(__dirname, 'src/utility/hooks') },
      { find: '@assets', replacement: path.resolve(__dirname, 'src/@core/assets') },
      { find: '@layouts', replacement: path.resolve(__dirname, 'src/@core/layouts') },
      { find: '@components', replacement: path.resolve(__dirname, 'src/@core/components') }
    ]
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.js$/,
    jsx: 'automatic'
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  }
})