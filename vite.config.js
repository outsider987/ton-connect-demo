import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills()
  ],
  server: {
    // Allow any host (needed for ngrok/tunnels)
    // If 'true' throws error in older Vite, use ['.ngrok-free.dev', '.loca.lt']
    allowedHosts: true,
    host: true
  }
})
