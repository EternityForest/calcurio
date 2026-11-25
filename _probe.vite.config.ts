import { defineConfig } from 'vite';

export default defineConfig({
  root: '_probe',
  base: './',
  build: {
    target: 'es2022',
    outDir: 'dist',
    emptyOutDir: true,
  },
});
