// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: ['@nuxt/eslint', '@nuxt/ui'],
  devtools: { enabled: true },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
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
})
