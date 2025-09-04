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
              'router-vendor': ['react-router-dom'],
              'firebase-vendor': ['firebase/app', 'firebase/auth', 'firebase/firestore'],
              'ui-vendor': ['framer-motion', 'tailwind-merge'],
              'markdown-vendor': ['remark-gfm', 'remark-math', 'rehype-katex', 'rehype-sanitize', 'react-markdown', 'marked', 'hast-util-sanitize'],
              'syntax-vendor': ['shiki'],
              'chart-vendor': ['mermaid'],
              'math-vendor': ['katex'],
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
