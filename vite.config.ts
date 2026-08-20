import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'node:path';

// Vite library mode: produce ES + CJS bundles for npm consumers
// See https://vitejs.dev/guide/build.html#library-mode
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'ReactCockpitMap',
      fileName: (format) => `react-cockpit-map.${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      // React / ReactDOM / Leaflet are peer deps — consumer provides them
      external: ['react', 'react-dom', 'react/jsx-runtime', 'leaflet'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          'react/jsx-runtime': 'jsxRuntime',
          leaflet: 'L',
        },
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'style.css') return 'style.css';
          return 'assets/[name][extname]';
        },
      },
    },
    // R46 lesson: keep CSS bundled into single file. Vite library mode emits
    // a single style.css (no chunking) which matches the Netlify "no chunk
    // CSS" rule that fixed the deployment CSS-drop bug.
    cssCodeSplit: false,
    sourcemap: true,
    emptyOutDir: true,
    target: 'es2020',
  },
});