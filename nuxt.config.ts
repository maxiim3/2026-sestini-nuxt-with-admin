// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxtjs/i18n'],
  devtools: { enabled: true },

  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      meta: [{ name: 'theme-color', content: '#0e1011' }],
    },
  },

  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    db: {
      url: '',
      authToken: '',
    },
  },
  compatibilityDate: '2026-10-01',

  nitro: {
    serverAssets: [{ baseName: 'migrations', dir: './database/migrations' }],
  },

  eslint: {
    config: { stylistic: true },
  },

  // Polices auto-hébergées (Fontsource) : pas d'appel à Google Fonts
  fonts: { providers: { google: false, googleicons: false, bunny: false, fontshare: false, fontsource: false, adobe: false } },

  i18n: {
    locales: [
      { code: 'fr', language: 'fr-FR', name: 'Français', file: 'fr.json' },
      { code: 'en', language: 'en-GB', name: 'English', file: 'en.json' },
      { code: 'es', language: 'es-ES', name: 'Español', file: 'es.json' },
      { code: 'it', language: 'it-IT', name: 'Italiano', file: 'it.json' },
    ],
    defaultLocale: 'fr',
    strategy: 'prefix_except_default',
    customRoutes: 'meta',
    baseUrl: 'https://www.sestini-pizza.fr',
    detectBrowserLanguage: false,
  },
})
