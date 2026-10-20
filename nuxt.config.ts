// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxtjs/i18n', 'nuxt-auth-utils', '@nuxtjs/mcp-toolkit'],
  devtools: { enabled: true },

  app: {
    head: {
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
      meta: [{ name: 'theme-color', content: '#0e1011' }],
    },
  },

  css: ['~/assets/css/main.css'],

  ui: {
    colorMode: false,
  },
  runtimeConfig: {
    db: {
      url: '',
      authToken: '',
    },
    resend: {
      apiKey: '',
      from: 'Sestini Pizza <atelier@sestini-pizza.fr>',
    },
    blob: {
      token: '',
    },
    posthog: {
      personalApiKey: '',
      projectId: '',
      host: 'https://eu.posthog.com',
    },
    public: {
      posthog: {
        key: '',
        host: 'https://eu.i.posthog.com',
      },
    },
  },
  compatibilityDate: '2026-10-01',

  nitro: {
    experimental: { asyncContext: true },
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

  mcp: {
    name: 'Sestini Pizza',
    version: '1.0.0',
    description: 'Pilotage du site de Sestini Pizza (camion pizza au feu de bois) : carte, pizza du moment, horaires, lieux, messages, réglages, audience.',
    instructions: [
      'Tu pilotes le site de Sestini Pizza pour ses propriétaires. Langue : français.',
      'Commence par site_overview. Lis avant d\'écrire (get_menu, get_schedule, search_catalog, list_modal_messages).',
      'Les écritures créent un BROUILLON par défaut, validé par un humain dans l\'atelier ; ne passe publish: true que si l\'utilisateur le demande explicitement.',
      'N\'efface rien : archive. Les anciennes pizzas du moment et anciennes cartes sont des modèles réutilisables (search_catalog avec includeArchived).',
      'Quand tu changes un contenu visible (pizza, message, exception), fournis aussi les traductions en, es, it.',
      'Prix en centimes dans les opérations génériques. Horaires : le public ne voit que l\'heure d\'ouverture (« dès 18h »).',
      'Une fermeture ou un événement mérite souvent un message de modale programmé sur la même période (schedule_modal_message).',
    ].join('\n'),
    browserRedirect: '/atelier/ia',
  },
})
