import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// Emit dist/404.html as a copy of dist/index.html after build.
// Cloudflare Pages auto-serves /404.html for any path that doesn't match
// a static asset; since 404.html IS the SPA shell, React Router takes
// over and renders the correct page on direct URL hits and refreshes.
// This replaces public/_redirects whose `/* /index.html 200` rule was
// rejected by Cloudflare's validator (error 10021 "Infinite loop").
function emitSpaFallback() {
  return {
    name: 'moromoke-spa-fallback',
    apply: 'build' as const,
    closeBundle() {
      const src = resolve(process.cwd(), 'dist/index.html')
      const dest = resolve(process.cwd(), 'dist/404.html')
      if (existsSync(src)) copyFileSync(src, dest)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), emitSpaFallback()],
  preview: { port: 4174 },
  server: {
    port: 5173,
    proxy: {
      '/api/anthropic': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
        headers: { 'anthropic-version': '2023-06-01' },
      },
    },
  },
})
