import { defineConfig } from 'vite';
// base './' makes the build work from any sub-path (e.g. GitHub Pages at /<repo>/)
export default defineConfig({ base: './', server: { port: 5173, open: false }, build: { chunkSizeWarningLimit: 2000 } });
