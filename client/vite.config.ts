import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// `loadEnv(mode, dir, '')` — the empty third argument disables the default
// "VITE_" prefix filter, so unprefixed vars like BACKEND_URL are visible here.
// They stay in Node and are never inlined into the bundle; only VITE_* vars
// reach the browser. Shell env still wins, which is what lets
// `BACKEND_URL=... npm run dev` override the file.
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  const backendTarget = env.BACKEND_URL || 'http://localhost:4000';
  const port = Number(env.CLIENT_PORT || 3000);

  const proxy = {
    '/api': {
      target: backendTarget,
      changeOrigin: true,
    },
    '/ws': {
      target: backendTarget,
      ws: true,
      changeOrigin: true,
    },
  };

  return {
    plugins: [react()],
    server: { host: '0.0.0.0', port, proxy },
    preview: { host: '0.0.0.0', port, proxy },
  };
});
