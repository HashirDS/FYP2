import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/generate-poem': 'http://localhost:5000',
      '/generate-audio': 'http://localhost:5000'
    }
  }
})

