import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

import pkg from './package.json' with { type: 'json' }

import { iconNamesParam } from './src/lib/icons.ts'

// https://vite.dev/config/
export default defineConfig({
  define: {
    __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    // Material Symbols: o index.html pede só os ícones do mapa (src/lib/icons.ts).
    {
      name: 'forja-icon-names',
      transformIndexHtml: (html) => html.replace('__ICON_NAMES__', iconNamesParam()),
    },
    react(),
    tailwindcss(),
    VitePWA({
      // 'prompt': a versão nova espera o usuário tocar "Atualizar agora" (UpdateBanner).
      registerType: 'prompt',
      includeAssets: ['icons/favicon-32x32.png', 'icons/favicon-16x16.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'FORJA — Sistema de Alta Performance',
        short_name: 'FORJA',
        description: 'Seu sistema operacional pessoal. Metas, treino, saúde, foco.',
        lang: 'pt-BR',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,ico,woff,woff2}'],
        runtimeCaching: [
          {
            // CSS do Google Fonts (Bricolage, Space Mono, Material Symbols): atualiza em segundo plano.
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'google-fonts-css' },
          },
          {
            // Arquivos das fontes: imutáveis por URL — cache de 1 ano deixa o PWA legível offline.
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-files',
              expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
