/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// Configuración de Vite: React + PWA instalable.
// Usamos "injectManifest" porque en la Fase 3 el service worker
// (src/sw.ts) gestionará también las notificaciones push.
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      manifest: {
        name: 'Gestión de Tareas',
        short_name: 'Tareas',
        description: 'Crea tareas por voz o por texto.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait-primary',
        background_color: '#0e1012',
        theme_color: '#0e1012',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      injectManifest: {
        // Solo precacheamos los subconjuntos latinos de Inter (suficiente para español).
        globPatterns: [
          '**/*.{js,css,html,svg,png}',
          '**/inter-latin-wght-normal-*.woff2',
          '**/inter-latin-ext-wght-normal-*.woff2',
        ],
      },
      devOptions: { enabled: false },
    }),
  ],
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.{ts,tsx}'],
  },
});
