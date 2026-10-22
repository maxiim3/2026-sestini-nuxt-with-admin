import { count } from 'drizzle-orm'
import type { Allergen, BaseKind, DrinkCategory, IngredientKind, MenuSection, Weekday } from '../../shared/domain/constants'
import legacy from './seed/legacy.json'
import translationsJson from './seed/translations.json'
import * as s from './schema'
import type { Database } from '../utils/db'

interface LegacyData {
  ingredients: { slug: string, name: string, kind: IngredientKind, allergens: Allergen[] }[]
  pizzas: {
    slug: string
    name: string
    baseKind: BaseKind
    baseLabel: string
    priceCents: number
    avant: string[]
    apres: string[]
    extraAllergens: Allergen[]
    archived: boolean
  }[]
  menus: { slug: string, name: string, status: 'active' | 'archived', items: { pizza: string, section: MenuSection, position: number }[] }[]
  featured: { pizza: string, title: string, period: string }[]
  drinks: { name: string, volume: string | null, category: DrinkCategory, priceCents: number, position: number }[]
  supplements: { label: string, priceCents: number, position: number }[]
}

const data = legacy as LegacyData

type Tri = { en: string, es: string, it: string }
const tr = translationsJson as {
  ingredients: Record<string, Tri>
  baseLabels: Record<string, Tri>
  drinks: Record<string, Tri>
  supplements: Record<string, Tri>
  menus: Record<string, { name: Tri, tagline?: Tri }>
  modal: Record<string, { title: Tri, body: Tri }>
}

/** { name: {en, es, it}, … } → { en: { name }, es: { name }, it: { name } } */
function i18nOf(fields: Record<string, Tri | undefined>) {
  const out: Record<'en' | 'es' | 'it', Record<string, string>> = { en: {}, es: {}, it: {} }
  for (const [field, values] of Object.entries(fields)) {
    if (!values) continue
    for (const l of ['en', 'es', 'it'] as const) out[l][field] = values[l]
  }
  return out
}
const ARCHIVED_AT = '2026-10-20T00:00:00.000Z'

export const SITE_SETTINGS = {
  'site.contact': {
    phone: '07 88 52 91 78',
    email: 'sestini.pizza@gmail.com',
    instagram: 'https://www.instagram.com/sestini.pizza',
    facebook: 'https://www.facebook.com/sestini.pizza',
    company: 'SARL 10558442XD',
  },
  'site.features': { desserts: false, reviews: true, featuredOnHome: true },
  'site.pitch': {
    title: 'La pizza au feu de bois',
    text: 'Pâte maison reposée plusieurs jours, produits frais, locaux et de saison, cuite au feu de bois devant vous.',
  },
} as const

/** Remplit une base vide avec les données de l'ancien site. Retourne false si la base contient déjà des données. */
export async function seedDatabase(db: Database): Promise<boolean> {
  const [row] = await db.select({ n: count() }).from(s.locations)
  if (row && row.n > 0) return false

  await db.transaction(async (tx) => {
    await tx.insert(s.users).values({ email: 'maxiim3@proton.me', name: 'Maxime', role: 'owner' })

    await tx.insert(s.settings).values(
      Object.entries(SITE_SETTINGS).map(([key, value]) => ({ key, value })),
    )

    // Lieux
    const [pignan, vic, villeneuve] = await tx.insert(s.locations).values([
      { slug: 'pignan', name: 'Parking Coopérative Oléicole', address: '1 Ancienne Route de Cournonterral', city: 'Pignan', zip: '34570', lat: 43.57884, lng: 3.75509 },
      { slug: 'vic-la-gardiole', name: 'Parking La Couleur des Saisons', address: '2 Chemin de la Source', city: 'Vic-la-Gardiole', zip: '34110', lat: 43.4986, lng: 3.78784 },
      { slug: 'villeneuve-les-maguelone', name: 'Parking Intermarché Super', address: '93 Rue des Troènes', city: 'Villeneuve-lès-Maguelone', zip: '34750', lat: 43.53764, lng: 3.85798 },
    ]).returning()
    const [centreCulturel] = await tx.insert(s.locations).values({
      slug: 'villeneuve-centre-culturel',
      name: 'Parking du centre culturel',
      address: 'Centre culturel',
      city: 'Villeneuve-lès-Maguelone',
      zip: '34750',
      lat: 43.5326,
      lng: 3.8622,
      notes: 'Lieu ponctuel (événement du 26/09/2026). Adresse et coordonnées à vérifier.',
    }).returning()

    // Saisons : hors saison (par défaut) et été 7j/7
    const [horsSaison, ete] = await tx.insert(s.seasons).values([
      { slug: 'hors-saison', name: 'Hors saison (mercredi → dimanche)', isDefault: true, priority: 0 },
      { slug: 'ete-2026', name: 'Été 2026 (7j/7)', startsOn: '2026-07-01', endsOn: '2026-08-15', priority: 10 },
    ]).returning()

    const slot = (seasonId: string, weekday: Weekday, locationId: string, closesAt: string) =>
      ({ seasonId, weekday, locationId, opensAt: '18:00', closesAt })
    await tx.insert(s.scheduleSlots).values([
      slot(horsSaison!.id, 3, pignan!.id, '21:00'),
      slot(horsSaison!.id, 4, vic!.id, '21:00'),
      slot(horsSaison!.id, 5, pignan!.id, '22:00'),
      slot(horsSaison!.id, 6, villeneuve!.id, '22:00'),
      slot(horsSaison!.id, 7, villeneuve!.id, '22:00'),
      slot(ete!.id, 1, pignan!.id, '21:00'),
      slot(ete!.id, 2, pignan!.id, '21:00'),
      slot(ete!.id, 3, pignan!.id, '21:00'),
      slot(ete!.id, 4, vic!.id, '21:00'),
      slot(ete!.id, 5, pignan!.id, '22:00'),
      slot(ete!.id, 6, villeneuve!.id, '22:00'),
      slot(ete!.id, 7, villeneuve!.id, '22:00'),
    ])

    await tx.insert(s.scheduleExceptions).values({
      kind: 'relocated',
      startsOn: '2026-09-26',
      endsOn: '2026-09-26',
      locationId: centreCulturel!.id,
      opensAt: '18:00',
      note: 'Événement exceptionnel : carte réduite, commande par téléphone.',
    })

    // Ingrédients
    const ingredientRows = await tx.insert(s.ingredients).values(data.ingredients.map(i => ({ ...i, i18n: i18nOf({ name: tr.ingredients[i.slug] }) }))).returning()
    const ingredientId = new Map(ingredientRows.map(r => [r.slug, r.id]))

    // Pizzas
    const pizzaRows = await tx.insert(s.pizzas).values(data.pizzas.map(p => ({
      slug: p.slug,
      name: p.name,
      baseKind: p.baseKind,
      baseLabel: p.baseLabel,
      priceCents: p.priceCents,
      extraAllergens: p.extraAllergens,
      i18n: i18nOf({ baseLabel: tr.baseLabels[p.baseLabel] }),
      archivedAt: p.archived ? ARCHIVED_AT : null,
    }))).returning()
    const pizzaId = new Map(pizzaRows.map(r => [r.slug, r.id]))

    const links = data.pizzas.flatMap(p => [
      ...p.avant.map((slug, position) => ({ pizzaId: pizzaId.get(p.slug)!, ingredientId: ingredientId.get(slug)!, stage: 'avant' as const, position })),
      ...p.apres.map((slug, position) => ({ pizzaId: pizzaId.get(p.slug)!, ingredientId: ingredientId.get(slug)!, stage: 'apres' as const, position })),
    ])
    await tx.insert(s.pizzaIngredients).values(links)

    // Cartes
    for (const menu of data.menus) {
      const [m] = await tx.insert(s.menus).values({
        slug: menu.slug,
        name: menu.name,
        status: menu.status,
        tagline: menu.status === 'active' ? 'Des produits de saison pour accompagner l\'automne et l\'hiver.' : null,
        i18n: i18nOf({ name: tr.menus[menu.slug]?.name, tagline: tr.menus[menu.slug]?.tagline }),
      }).returning()
      await tx.insert(s.menuItems).values(menu.items.map(item => ({
        menuId: m!.id,
        pizzaId: pizzaId.get(item.pizza)!,
        section: item.section,
        position: item.position,
      })))
    }

    // Anciennes pizzas du moment (archivées, servent de modèles)
    await tx.insert(s.featuredPizzas).values(data.featured.map(f => ({
      pizzaId: pizzaId.get(f.pizza)!,
      title: f.title,
      pitch: `Archive : ${f.period}`,
      showInModal: true,
      archivedAt: ARCHIVED_AT,
    })))

    await tx.insert(s.drinks).values(data.drinks.map(d => ({ ...d, i18n: i18nOf({ name: tr.drinks[d.name] }) })))
    await tx.insert(s.supplements).values(data.supplements.map(x => ({ ...x, i18n: i18nOf({ label: tr.supplements[x.label] }) })))

    // Messages de la modale
    const modalI18n = (title: string) => i18nOf({ title: tr.modal[title]?.title, body: tr.modal[title]?.body })
    await tx.insert(s.modalMessages).values([
      {
        kind: 'menu',
        title: 'Découvrez la carte Automne-Hiver !',
        body: 'Laissez-vous tenter par notre **toute nouvelle carte**, faite maison, imaginée pour vous régaler.\n\nDes produits de saison pour accompagner l\'automne et l\'hiver.\n\nRetrouvez toutes nos pizzas préférées, rouges, blanches et spéciales, avec une carte maison pensée pour toute la saison.',
        ctas: [
          { label: 'Voir la carte', href: '/la-carte', variant: 'primary' },
          { label: 'Nous trouver', href: '/nous-trouver', variant: 'secondary' },
        ],
        priority: 10,
        i18n: modalI18n('Découvrez la carte Automne-Hiver !'),
      },
      {
        kind: 'event',
        title: 'Événement exceptionnel',
        body: 'Aujourd\'hui, retrouvez-nous exceptionnellement sur le **parking du centre culturel** à Villeneuve-lès-Maguelone.\n\nPossibilité de commander par téléphone des pizzas à partir de 18 heures avec une carte réduite.',
        ctas: [{ label: 'Appeler', href: 'tel:+33788529178', variant: 'primary' }],
        startsAt: '2026-09-25T22:00:00.000Z',
        endsAt: '2026-09-26T22:00:00.000Z',
        priority: 100,
        i18n: modalI18n('Événement exceptionnel'),
      },
    ])
  })

  return true
}
