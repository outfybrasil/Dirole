import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.VITE_FOURSQUARE_API_KEY': JSON.stringify(env.VITE_FOURSQUARE_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      target: 'es2020',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'appwrite-vendor': ['appwrite'],
            'maps-vendor': ['leaflet', 'react-leaflet'],
            'ui-vendor': ['lucide-react', 'framer-motion'] // Add any other large UI libs here
          }
        }
      }
    },
    optimizeDeps: {
      include: ['appwrite']
    }
  };
});
