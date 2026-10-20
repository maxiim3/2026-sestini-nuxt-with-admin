type OgPage = 'home' | 'carte' | 'nous-trouver'

/** Titre, description, image de partage (par page et par langue) et URL canonique */
export function usePageSeo(options: { title: MaybeRefOrGetter<string>, description: MaybeRefOrGetter<string>, og: OgPage }) {
  const { locale } = useI18n()
  const site = useSiteConfig()
  const image = computed(() => `${site.url}/og/${options.og}-${locale.value}.jpg`)
  useSeoMeta({
    title: () => toValue(options.title),
    description: () => toValue(options.description),
    ogTitle: () => toValue(options.title),
    ogDescription: () => toValue(options.description),
    ogType: 'website',
    ogSiteName: 'Sestini Pizza',
    ogImage: image,
    ogImageWidth: 1200,
    ogImageHeight: 630,
    ogImageAlt: () => toValue(options.title),
    twitterCard: 'summary_large_image',
    twitterImage: image,
  })
}

/** Données structurées schema.org, servies par /api/public/seo */
export function useJsonLd(kind: 'restaurant' | 'menu') {
  // useHead doit être appelé avant tout await (contexte Nuxt) : on renvoie la requête, que l'appelant peut attendre
  const request = useFetch('/api/public/seo', { key: 'seo', dedupe: 'defer' })
  useHead(() => ({
    script: request.data.value ? [{ key: `ld-${kind}`, type: 'application/ld+json', innerHTML: JSON.stringify(request.data.value[kind]) }] : [],
  }))
  return request
}
