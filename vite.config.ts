import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import wasm from 'vite-plugin-wasm';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig(() => {
  return {
    plugins: [wasm(), react(), tailwindcss()],
    build: {
      target: 'esnext',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        'cross-fetch': path.resolve(__dirname, 'src/shims/cross-fetch.ts'),
      },
    },
    server: {
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
