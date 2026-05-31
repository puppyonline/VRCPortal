import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  server: {
    proxy: {
      '/api': {
        target: 'https://api.vrchat.cloud',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '/api'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            // Forward the User-Agent from the client request if present,
            // otherwise use a default identifier
            const clientUA = req.headers['user-agent'];
            if (clientUA && clientUA.startsWith('VRChatPortal')) {
              proxyReq.setHeader('User-Agent', clientUA);
            } else {
              proxyReq.setHeader('User-Agent', 'VRChatPortal/1.0.0 self-hosted');
            }
          });
        },
      },
      '/statusapi': {
        target: 'https://status.vrchat.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/statusapi/, '/api'),
      }
    }
  }
});
