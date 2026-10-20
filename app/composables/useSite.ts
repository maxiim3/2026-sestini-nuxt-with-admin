/** Instantané public du site (carte, horaires, modale…), partagé par toutes les pages */
export function useSite() {
  return useFetch('/api/public/site', {
    key: 'site',
    dedupe: 'defer',
  })
}

export type Site = NonNullable<Awaited<ReturnType<typeof useSite>>['data']['value']>
export type SitePizza = NonNullable<Site['menu']>['sections'][number]['pizzas'][number]
export type SiteDay = Site['week'][number]

/** Coordonnées de contact depuis les réglages */
export function useContact() {
  const { data } = useSite()
  return computed(() => {
    const settings = (data.value?.settings ?? {}) as Record<string, unknown>
    const contact = (settings['site.contact'] ?? {}) as { phone?: string, email?: string, instagram?: string, facebook?: string }
    const phone = contact.phone ?? '07 88 52 91 78'
    return {
      phone,
      phoneHref: `tel:${internationalPhone(phone)}`,
      email: contact.email ?? 'sestini.pizza@gmail.com',
      instagram: contact.instagram ?? 'https://www.instagram.com/sestini.pizza',
      facebook: contact.facebook ?? 'https://www.facebook.com/sestini.pizza',
    }
  })
}
