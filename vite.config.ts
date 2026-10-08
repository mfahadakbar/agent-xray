import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The build is one self-contained index.html (scripts, styles and fonts inlined),
// so dist/index.html opens with a double-click and can be hosted anywhere.
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  server: { port: 5177, strictPort: false },
  preview: { port: 5178, strictPort: false },
  build: {
    target: 'es2022',
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 4000,
  },
});
