import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  ssr: false,
  modules: ['@vite-pwa/nuxt'],
  css: ['~/assets/css/main.css'],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: [
        '@vue/devtools-core',
        '@vue/devtools-kit',
        'lucide-vue-next',
      ]
    }
  },
  app: {
    head: {
      title: 'Twitch Multistream',
      htmlAttrs: { lang: 'en' },
    },
  },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'Sunzone',
      short_name: 'Sunzone',
      description: 'Watch multiple Twitch streams at once',
      theme_color: '#9147ff',
      background_color: '#0e0e10',
      display: 'fullscreen',
      orientation: 'landscape',
      icons: [
        {
          src: '/favicon.ico',
          sizes: '48x48',
          type: 'image/x-icon',
        },
      ],
    },
    workbox: {
      navigateFallback: '/',
    },
    devOptions: {
      enabled: true,
      type: 'module',
    },
  },
})
