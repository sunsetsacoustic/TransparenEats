import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    allowedHosts: [
      '4af9-2601-2c5-4585-1120-f929-35cf-447c-74c4.ngrok-free.app'
    ],
    proxy: {
      '/api/v1': 'https://transpareneats.onrender.com'
    }
  }
}); 