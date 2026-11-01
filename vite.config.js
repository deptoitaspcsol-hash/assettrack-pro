import base44 from "@base44/vite-plugin"
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  logLevel: 'error', // Suppress warnings, only show errors
  plugins: [
    base44({
      // Support for legacy code that imports the base44 SDK with @/integrations, @/entities, etc.
      // can be removed if the code has been updated to use the new SDK imports from @base44/sdk
      legacySDKImports: process.env.BASE44_LEGACY_SDK_IMPORTS === 'true',
      hmrNotifier: true,
      navigationNotifier: true,
      analyticsTracker: true,
      visualEditAgent: true
    }),
    react(),
    VitePWA({
      // "prompt": la versión nueva se instala solo cuando el usuario acepta (ver PWAManager),
      // así nunca se recarga la página a mitad de un formulario.
      registerType: 'prompt',
      injectRegister: false, // el registro lo hace src/components/pwa/PWAManager.jsx
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        id: '/',
        name: 'AssetTrack Pro',
        short_name: 'AssetTrack',
        description: 'Gestión de activos, asignaciones y tickets de soporte de equipos de cómputo.',
        lang: 'es',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'any',
        background_color: '#f8fafc',
        theme_color: '#4f46e5',
        categories: ['business', 'productivity', 'utilities'],
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
        shortcuts: [
          { name: 'Inventario', url: '/Inventory', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
          { name: 'Tickets de soporte', url: '/Tickets', icons: [{ src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' }] },
        ],
      },
      workbox: {
        // Se precachea solo la "carcasa" de la app (JS, CSS, HTML, iconos).
        globPatterns: ['**/*.{js,css,html,svg,png,ico,webmanifest}'],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        cleanupOutdatedCaches: true,
        // Rutas de la SPA: cualquier navegación devuelve index.html (también sin conexión)...
        navigateFallback: '/index.html',
        // ...excepto la API de Base44 y las rutas internas de la plataforma.
        navigateFallbackDenylist: [/^\/api\//, /^\/__/, /\/[^/?]+\.[^/]+$/],
        runtimeCaching: [
          {
            // Datos y autenticación: NUNCA desde caché (son privados y cambian).
            urlPattern: ({ url }) => url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
          {
            // Imágenes (p. ej. fotos de equipos): rápidas desde caché y se refrescan en segundo plano.
            urlPattern: ({ request }) => request.destination === 'image',
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'assettrack-images',
              expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      devOptions: { enabled: false },
    }),
  ]
});
