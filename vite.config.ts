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
      // Necessário para receber eventos `push` mesmo com o PWA fechado.
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'service-worker.ts',
      includeAssets: ['icons/favicon-simple-32x32.png', 'icons/favicon-simple-16x16.png', 'icons/apple-touch-icon.png'],
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
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        globPatterns: ['**/*.{js,css,html,png,ico,woff,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
