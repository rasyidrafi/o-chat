import path from 'path';
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(() => {
    return {
      plugins: [tailwindcss()],
      build: {
        outDir: 'extension',
        emptyOutDir: false, // Don't empty the extension dir as it has manifest.json
        rollupOptions: {
          input: {
            popup: path.resolve(__dirname, 'extension-popup.html')
          },
          output: {
            // Custom file naming for extension
            entryFileNames: 'popup.js',
            chunkFileNames: 'popup-[name].js',
            assetFileNames: (assetInfo) => {
              if (assetInfo.name === 'extension-popup.html') {
                return 'popup.html';
              }
              return 'popup-[name].[ext]';
            },
            manualChunks: undefined // Disable manual chunks for simpler extension structure
          }
        },
        cssCodeSplit: false, // Bundle all CSS into one file
        chunkSizeWarningLimit: 2000, // Increase limit for extension bundle
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      define: {
        // Ensure process.env is available for extension context
        'process.env': {}
      }
    };
});