import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    base: './',
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false
    },
    define: {
      // This ensures process.env.API_KEY works in the browser code
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Polyfill minimal process for other libs if needed
      'process.env': {}
    }
  }
})