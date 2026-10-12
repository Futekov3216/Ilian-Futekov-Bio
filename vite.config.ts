import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `base: './'` keeps asset paths relative, so the built `docs/` folder works
// from any sub-path (e.g. GitHub Pages at /<repo>/) without extra config.
export default defineConfig({
  base: './',
  build: { outDir: 'docs' },
  plugins: [react()],
});
