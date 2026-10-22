import { WEEKDAY_SLUGS } from '../../shared/domain/constants'
import { formatPrice } from '../../shared/domain/money'
import type { PublicSnapshot } from './catalog'

const SCHEMA_DAYS = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

function phoneE164(snap: PublicSnapshot) {
  const contact = (snap.settings['site.contact'] ?? {}) as { phone?: string }
  return (contact.phone ?? '07 88 52 91 78').replace(/\D/g, '').replace(/^0/, '+33')
}

/** Semaine type (hors exceptions) : lieu → jours d'ouverture */
function typicalWeek(snap: PublicSnapshot) {
  const byLocation = new Map<string, { location: NonNullable<PublicSnapshot['week'][number]['location']>, days: { weekday: number, opensAt: string }[] }>()
  for (const day of snap.week.slice(0, 7)) {
    if (!day.open || !day.location || day.exception) continue
    const entry = byLocation.get(day.location.id) ?? { location: day.location, days: [] }
    entry.days.push({ weekday: day.weekday, opensAt: day.opensAt ?? '18:00' })
    byLocation.set(day.location.id, entry)
  }
  return [...byLocation.values()]
}

export function restaurantJsonLd(snap: PublicSnapshot, siteUrl: string) {
  const id = `${siteUrl}/#restaurant`
  const prices = snap.menu?.sections.flatMap(s => s.pizzas.map(p => p.priceCents)) ?? []
  const priceRange = prices.length ? `${formatPrice(Math.min(...prices))} - ${formatPrice(Math.max(...prices))}` : '€€'
  const contact = (snap.settings['site.contact'] ?? {}) as { email?: string, instagram?: string, facebook?: string }
  const telephone = phoneE164(snap)

  const places = typicalWeek(snap).map(({ location, days }) => ({
    '@type': 'Restaurant',
    '@id': `${siteUrl}/nous-trouver#${location.slug}`,
    'name': `Sestini Pizza ${location.city}`,
    'description': `Camion pizza au feu de bois à ${location.city} (${location.name}), pizzas à emporter le ${days.map(d => WEEKDAY_SLUGS[d.weekday as 1]).join(' et le ')} soir.`,
    'url': `${siteUrl}/nous-trouver`,
    telephone,
    'image': `${siteUrl}/og/home-fr.jpg`,
    'servesCuisine': ['Pizza', 'Italienne'],
    priceRange,
    'hasMenu': `${siteUrl}/la-carte`,
    'acceptsReservations': false,
    'parentOrganization': { '@id': id },
    'address': { '@type': 'PostalAddress', 'streetAddress': location.address, 'addressLocality': location.city, 'postalCode': location.zip, 'addressRegion': 'Occitanie', 'addressCountry': 'FR' },
    'geo': { '@type': 'GeoCoordinates', 'latitude': location.lat, 'longitude': location.lng },
    'openingHoursSpecification': days.map(d => ({ '@type': 'OpeningHoursSpecification', 'dayOfWeek': `https://schema.org/${SCHEMA_DAYS[d.weekday]}`, 'opens': d.opensAt })),
  }))

  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'FoodEstablishment'],
        '@id': id,
        'name': 'Sestini Pizza',
        'alternateName': ['Sestini', 'Sestini Pizza Montpellier'],
        'url': siteUrl,
        'logo': `${siteUrl}/icons/icon-512.png`,
        'image': `${siteUrl}/og/home-fr.jpg`,
        'slogan': 'La pizza au feu de bois',
        telephone,
        'email': contact.email,
        'sameAs': [contact.facebook, contact.instagram].filter(Boolean),
        'servesCuisine': ['Pizza', 'Italienne'],
        priceRange,
        'hasMenu': `${siteUrl}/la-carte`,
        'acceptsReservations': false,
        'areaServed': ['Montpellier', ...new Set(places.map(p => p.address.addressLocality))].map(name => ({ '@type': 'City', name })),
        'subOrganization': places.map(p => ({ '@id': p['@id'] })),
      },
      { '@type': 'WebSite', '@id': `${siteUrl}/#website`, 'url': siteUrl, 'name': 'Sestini Pizza', 'inLanguage': ['fr-FR', 'en-GB', 'es-ES', 'it-IT'], 'publisher': { '@id': id } },
      ...places,
    ],
  }
}

export function menuJsonLd(snap: PublicSnapshot, siteUrl: string) {
  const item = (name: string, cents: number, description?: string) => ({
    '@type': 'MenuItem',
    name,
    ...(description ? { description } : {}),
    'offers': { '@type': 'Offer', 'price': (cents / 100).toFixed(2), 'priceCurrency': 'EUR' },
  })
  const sections = [
    ...(snap.menu?.sections ?? []).map(s => ({
      name: { rouges: 'Pizzas rouges', blanches: 'Pizzas blanches', speciales: 'Pizzas spéciales' }[s.section],
      items: s.pizzas.map(p => item(p.name, p.priceCents, [p.baseLabel, ...p.avant.map(i => i.name), ...p.apres.map(i => i.name)].join(', '))),
    })),
    { name: 'Boissons', items: snap.drinks.map(d => item(`${d.name}${d.volume ? ` ${d.volume}` : ''}`, d.priceCents)) },
  ].filter(s => s.items.length)

  return {
    '@context': 'https://schema.org',
    '@type': 'Menu',
    '@id': `${siteUrl}/la-carte#menu`,
    'name': snap.menu ? `La carte ${snap.menu.name}` : 'La carte Sestini Pizza',
    'url': `${siteUrl}/la-carte`,
    'inLanguage': 'fr-FR',
    'offeredBy': { '@id': `${siteUrl}/#restaurant` },
    'hasMenuSection': sections.map(s => ({ '@type': 'MenuSection', 'name': s.name, 'hasMenuItem': s.items })),
  }
}

/** Résumé du site pour les assistants IA (https://llmstxt.org) */
export function llmsTxt(snap: PublicSnapshot, siteUrl: string) {
  const week = typicalWeek(snap)
    .map(({ location, days }) => `- ${days.map(d => WEEKDAY_SLUGS[d.weekday as 1]).join(', ')} : ${location.city}, ${location.name}, ${location.address} ${location.zip}, dès ${d0(days)}`)
    .join('\n')
  const upcoming = snap.week.filter(d => d.exception).map(d => `- ${d.date} : ${d.open ? `${d.location?.city} (exceptionnel)` : 'fermé'}${d.exception?.note ? `, ${d.exception.note}` : ''}`).join('\n')
  const menu = (snap.menu?.sections ?? []).map(s => s.pizzas.map(p => `- ${p.name} (${formatPrice(p.priceCents)}) : ${[p.baseLabel, ...p.avant.map(i => i.name)].join(', ')}${p.apres.length ? ` ; après cuisson : ${p.apres.map(i => i.name).join(', ')}` : ''}`).join('\n')).join('\n')
  const featured = snap.featured.map(f => `- ${f.title} : ${f.pizza.name} (${formatPrice(f.pizza.priceCents)})`).join('\n')
  return `# Sestini Pizza

> Camion pizza au feu de bois près de Montpellier. Pâte maison, produits frais, locaux et de saison. Pizzas à emporter, commande par téléphone au ${phoneE164(snap)} ou directement au camion, retrait et paiement sur place.

## Où et quand (semaine type, ouverture dès 18h)
${week}
${upcoming ? `\n## Exceptions à venir\n${upcoming}\n` : ''}
## Carte ${snap.menu?.name ?? ''}
${menu}
${featured ? `\n## Pizza du moment\n${featured}\n` : ''}
## Pages
- [La carte](${siteUrl}/la-carte)
- [Nous trouver](${siteUrl}/nous-trouver)
- Versions : [English](${siteUrl}/en), [Español](${siteUrl}/es), [Italiano](${siteUrl}/it)
`
}

function d0(days: { opensAt: string }[]) {
  return (days[0]?.opensAt ?? '18:00').replace(':00', 'h')
}
