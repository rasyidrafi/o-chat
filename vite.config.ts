import path from 'path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(() => {
    return {
      plugins: [tailwindcss()],
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              // Vendor chunks
              'react-vendor': ['react', 'react-dom'],
              'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
              'ui-vendor': ['framer-motion'],
              'markdown-vendor': ['unified', 'remark-parse', 'remark-gfm', 'remark-rehype', 'rehype-react'],
              'syntax-vendor': ['react-syntax-highlighter'],
              'chart-vendor': ['mermaid']
            }
          }
        },
        chunkSizeWarningLimit: 1000
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
