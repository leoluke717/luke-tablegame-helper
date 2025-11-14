import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  base: '/',
  resolve: {
    alias: {
      'vue': 'vue/dist/vue.esm-bundler.js'
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // 将Vue相关库分离
          'vue-vendor': ['vue', 'vue-router'],
          // 将Firebase分离（这是最大的第三方库）
          'firebase': ['firebase/app', 'firebase/database'],
          // 其他工具库
          'vendor': ['qrcode']
        }
      }
    },
    // 提高chunk大小警告阈值到1MB
    chunkSizeWarningLimit: 1000
  }
})
