import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath, URL } from 'url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Alias to browser-compatible modules
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      path: 'path-browserify',
      url: 'url',
      'source-map': 'source-map-js',
    },
  },
  optimizeDeps: {
    include: ['path-browserify', 'url', 'source-map-js'], // Include the browser-compatible versions for Vite to handle
  },
  build: {
    sourcemap: false, // Optionally disable source maps for production if not needed
  },
})
