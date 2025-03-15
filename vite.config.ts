import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  define: {
    'process.env.RESEND_API_KEY': JSON.stringify(process.env.RESEND_API_KEY),
    'import.meta.env.VITE_RESEND_API_KEY': JSON.stringify(process.env.RESEND_API_KEY)
  },
  server: {
    proxy: {
      '/igdb': {
        target: 'https://api.igdb.com/v4',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/igdb/, '')
      }
    }
  }
})