import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// Dynamically serves tonconnect-manifest.json based on incoming host/protocol.
const resolveProtocol = (req) => {
  const forwardedProto = req.headers['x-forwarded-proto'];
  if (Array.isArray(forwardedProto)) {
    return forwardedProto[0];
  }
  if (typeof forwardedProto === 'string' && forwardedProto.length > 0) {
    return forwardedProto.split(',')[0].trim(); // handles "https, http"
  }
  // Fallback: Vite dev server usually is http, but ngrok will set x-forwarded-proto
  return req.protocol || 'http';
};

const tonConnectManifestPlugin = () => ({
  name: 'tonconnect-manifest',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.startsWith('/tonconnect-manifest.json')) {
        const protocol = resolveProtocol(req);
        const origin = `${protocol}://${req.headers.host}`;
        const manifest = {
          url: origin,
          name: 'TON Connect Demo',
          iconUrl: `${origin}/vite.svg`
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(manifest, null, 2));
        return;
      }
      next();
    });
  },
  configurePreviewServer(server) {
    server.middlewares.use((req, res, next) => {
      if (req.url?.startsWith('/tonconnect-manifest.json')) {
        const protocol = resolveProtocol(req);
        const origin = `${protocol}://${req.headers.host}`;
        const manifest = {
          url: origin,
          name: 'TON Connect Demo',
          iconUrl: `${origin}/vite.svg`
        };
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Headers', '*');
        res.setHeader('Cache-Control', 'no-store');
        res.end(JSON.stringify(manifest, null, 2));
        return;
      }
      next();
    });
  }
});

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    nodePolyfills(),
    tonConnectManifestPlugin()
  ],
  server: {
    // Explicit host allowlist for tunnels (ngrok, etc.)
    allowedHosts: [
      '.ngrok-free.app',
      '.ngrok-free.dev',
      'localhost',
      '127.0.0.1'
    ],
    host: true
  }
})
