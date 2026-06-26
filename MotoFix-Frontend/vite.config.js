/// <reference types="vitest" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // requests to /api will be proxied to your backend server
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true, // needed for virtual hosted sites
        secure: false,      // if you're not using https
      },
    }
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.js', // a file to run before each test
  },
})