// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({

  modules: ['@nuxt/eslint', '@nuxt/ui', '@nuxtjs/i18n', 'nuxt-auth-utils', '@nuxtjs/mcp-toolkit', '@vite-pwa/nuxt', '@nuxtjs/sitemap', '@nuxtjs/robots'],
  devtools: { enabled: true },

  app: {
    head: {
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
        { rel: 'icon', type: 'image/png', sizes: '48x48', href: '/icons/favicon-48.png' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
      ],
      meta: [
        { name: 'theme-color', content: '#0e1011' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
        { name: 'apple-mobile-web-app-title', content: 'Sestini' },
        { name: 'format-detection', content: 'telephone=no' },
      ],
    },
  },

  css: ['~/assets/css/main.css'],

  site: {
    url: 'https://www.sestini-pizza.fr',
    name: 'Sestini Pizza',
  },

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

  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      id: '/',
      name: 'Sestini Pizza · La pizza au feu de bois',
      short_name: 'Sestini',
      description: 'Camion pizza au feu de bois près de Montpellier : la carte, où nous trouver ce soir, commande par téléphone.',
      lang: 'fr',
      dir: 'ltr',
      start_url: '/?source=pwa',
      scope: '/',
      display: 'standalone',
      display_override: ['window-controls-overlay', 'standalone'],
      orientation: 'portrait',
      background_color: '#0e1011',
      theme_color: '#0e1011',
      categories: ['food', 'lifestyle'],
      icons: [
        { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
        { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
        { src: '/icons/maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
      ],
      shortcuts: [
        { name: 'La carte', short_name: 'Carte', url: '/la-carte?source=shortcut', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        { name: 'Où êtes-vous ce soir ?', short_name: 'Nous trouver', url: '/nous-trouver?source=shortcut', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
        { name: 'Appeler pour commander', short_name: 'Appeler', url: '/appeler', icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }] },
      ],
      screenshots: [
        { src: '/screenshots/mobile-carte.jpg', sizes: '780x1688', type: 'image/jpeg', form_factor: 'narrow', label: 'La carte' },
        { src: '/screenshots/mobile-nous-trouver.jpg', sizes: '780x1688', type: 'image/jpeg', form_factor: 'narrow', label: 'Nous trouver' },
        { src: '/screenshots/desktop-carte.jpg', sizes: '1440x900', type: 'image/jpeg', form_factor: 'wide', label: 'La carte' },
      ],
      // Widget « Ce soir » (Windows / Edge, Adaptive Cards)
      widgets: [
        {
          name: 'Sestini · Ce soir',
          short_name: 'Ce soir',
          description: 'Où trouver le camion ce soir',
          tag: 'ce-soir',
          ms_ac_template: '/widgets/ce-soir.json',
          data: '/api/public/widget',
          type: 'application/json',
          screenshots: [{ src: '/icons/icon-512.png', sizes: '512x512', label: 'Ce soir' }],
          icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
          auth: false,
          update: 3600,
        },
      ],
      launch_handler: { client_mode: 'navigate-existing' },
    } as Record<string, unknown>,
    workbox: {
      navigateFallback: null,
      // Précache léger : styles, polices, icônes. Le JS (dont la 3D) est mis en cache à l'usage.
      globPatterns: ['**/*.{css,woff2,svg}', 'icons/*.png'],
      globIgnores: ['**/og/**', '**/screenshots/**'],
      runtimeCaching: [
        {
          urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/_nuxt/'),
          handler: 'CacheFirst',
          options: { cacheName: 'assets', expiration: { maxEntries: 120, maxAgeSeconds: 30 * 86400 } },
        },
        {
          urlPattern: ({ url }: { url: URL }) => url.pathname === '/api/public/site',
          handler: 'NetworkFirst',
          options: { cacheName: 'site-data', networkTimeoutSeconds: 4, expiration: { maxEntries: 4, maxAgeSeconds: 7 * 86400 } },
        },
        {
          urlPattern: ({ request, url }: { request: Request, url: URL }) => request.mode === 'navigate' && !/^\/(atelier|api|mcp|print)/.test(url.pathname),
          handler: 'NetworkFirst',
          options: { cacheName: 'pages', networkTimeoutSeconds: 4, expiration: { maxEntries: 30, maxAgeSeconds: 7 * 86400 } },
        },
      ],
    },
    client: { installPrompt: true },
    devOptions: { enabled: false },
  },

  robots: {
    disallow: ['/atelier', '/api', '/mcp', '/print'],
  },

  sitemap: {
    exclude: ['/atelier/**', '/print/**', '/mcp/**'],
  },
})
