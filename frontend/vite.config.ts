import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

// Injects BUILD_TIME into sw.js so the browser detects a new SW on every deploy
function injectSwVersion(): Plugin {
  return {
    name: 'inject-sw-version',
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist/sw.js');
      if (!fs.existsSync(swPath)) return;
      const buildTime = new Date().toISOString();
      const content = fs.readFileSync(swPath, 'utf-8');
      // Replace or prepend the BUILD_TIME line
      const marker = '// BUILD_TIME:';
      const newLine = `${marker} ${buildTime}`;
      const updated = content.startsWith(marker)
        ? content.replace(/^\/\/ BUILD_TIME:.*$/m, newLine)
        : `${newLine}\n${content}`;
      fs.writeFileSync(swPath, updated);
    },
  };
}

export default defineConfig({
  plugins: [react(), injectSwVersion()],
  resolve: {
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json'],
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
      '/hubs': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        ws: true,
      },
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
  },
});
