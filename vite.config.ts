import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// The manifest and the theme-color meta need literal colours: read them from the tokens.
function token(name: string): string {
  const css = readFileSync(new URL('./src/app/styles/tokens.css', import.meta.url), 'utf8')
  const value = new RegExp(`--${name}:\\s*(#[0-9a-f]{3,8})\\s*;`, 'i').exec(css)?.[1]

  if (!value) throw new Error(`tokens.css has no hex value for --${name}`)

  return value
}

const background = token('bg')

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      // `--mode e2e` is a production build wired to the emulators: never let it reach a real project.
      name: 'e2e-guard',
      configResolved({ mode, env }) {
        if (mode === 'e2e' && !String(env.VITE_FIREBASE_PROJECT_ID).startsWith('demo-')) {
          throw new Error('The e2e build needs VITE_FIREBASE_PROJECT_ID=demo-… (see .env.e2e)')
        }
      },
    },
    {
      name: 'theme-color',
      transformIndexHtml: () => [
        { tag: 'meta', attrs: { name: 'theme-color', content: background }, injectTo: 'head' },
      ],
    },
    VitePWA({
      strategies: 'generateSW',
      registerType: 'prompt',
      // src/app/layout/pwa-update.tsx registers sw.js; the plugin's helper needs workbox-window.
      injectRegister: false,
      // globPatterns already precache every icon; listing them again would duplicate entries.
      includeManifestIcons: false,
      manifest: {
        name: 'Personal Workout',
        short_name: 'Workout',
        description: 'Тренировки дома и в зале: наборы упражнений, подходы, история.',
        lang: 'ru',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        theme_color: background,
        background_color: background,
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}', 'catalog/*.json'],
        // exercises.json is about 1 MB; the default cap of 2 MiB leaves little room as the catalog grows.
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
        navigateFallback: 'index.html',
        // Firebase reserves /__/ (auth handler, init.json): never answer it with the app shell.
        navigateFallbackDenylist: [/^\/__\//],
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) =>
              sameOrigin && url.pathname.startsWith('/catalog/images/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'exercise-images',
              expiration: { maxEntries: 600, purgeOnQuotaError: true },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
    }),
  ],
  // Tailscale MagicDNS names (*.ts.net), so the dev server answers by name.
  // The e2e builds hold 1,700 catalog photos; watching them exhausts inotify (ENOSPC).
  server: { allowedHosts: ['.ts.net'], watch: { ignored: ['**/dist*/**'] } },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Vendor code changes less often than the app, so it keeps its cache across deploys.
        codeSplitting: {
          groups: [
            { name: 'firebase-sdk', test: /node_modules[\\/](@firebase|firebase)[\\/]/ },
            {
              name: 'react',
              test: /node_modules[\\/](react|react-dom|react-router|scheduler)[\\/]/,
            },
          ],
        },
      },
    },
  },
})
