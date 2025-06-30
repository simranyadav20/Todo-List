import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/Todo-List/', // ✅ this line is CRITICAL
  plugins: [react()],
})

