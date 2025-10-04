import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // FIX: Replaced process.cwd() with '.' to resolve missing 'process' type definitions.
  const env = loadEnv(mode, '.', '')
  
  return {
    base: '/alsanicockpitv3/',
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    envPrefix: 'VITE_'
  }
})
