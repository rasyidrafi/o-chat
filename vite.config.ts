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
              'markdown-vendor': ['unified', 'remark-parse', 'remark-gfm', 'remark-math', 'remark-rehype', 'rehype-react', 'katex', 'rehype-katex'],
              'syntax-vendor': ['highlight.js'],
              'chart-vendor': ['mermaid'],
              'openai-vendor': ['openai']
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
