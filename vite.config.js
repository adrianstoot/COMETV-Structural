import { defineConfig } from 'vite'

export default defineConfig({
  base: '/COMETV-Structural/',
  build: {
    outDir: 'dist',
  },
  server: {
    host: '0.0.0.0',
    allowedHosts: true,
    port: 5199,
  }
})
