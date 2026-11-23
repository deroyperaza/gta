import { defineConfig } from 'vite';
// base './' makes the build work from any sub-path (e.g. GitHub Pages at /<repo>/)
// __BUILD__: when this bundle was built (New York time), so a phone can show which version it's running
const BUILD = new Date().toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
export default defineConfig({ define: { __BUILD__: JSON.stringify(BUILD) }, base: './', server: { port: 5173, open: false }, build: { chunkSizeWarningLimit: 2000 } });
