import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'zustand/react': path.resolve(__dirname, './node_modules/zustand/react.js'),
      'zustand/middleware': path.resolve(__dirname, './node_modules/zustand/middleware.js'),
      'zustand/vanilla': path.resolve(__dirname, './node_modules/zustand/vanilla.js'),
    },
  },
})
