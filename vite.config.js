import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// The football-data.org free tier does not allow direct browser calls
// (no CORS, and the auth token must stay server-side). In dev we proxy
// /api -> https://api.football-data.org and inject the token here so it
// never ships to the client bundle.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const token = env.FOOTBALL_DATA_TOKEN || ''

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: 'https://api.football-data.org',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, ''),
          headers: token ? { 'X-Auth-Token': token } : {},
        },
      },
    },
  }
})
