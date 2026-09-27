import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './', // relative base for GitHub Pages deployment under manmeet3591.github.io/kentucky_s2s/
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
