import { and, asc, desc, eq, inArray, isNull } from 'drizzle-orm'
import { type Allergen, DOUGH_ALLERGENS, type MenuSection } from '../../shared/domain/constants'
import { isoDateInParis, isWithin } from '../../shared/domain/dates'
import { pickModalMessage } from '../../shared/domain/modal'
import { resolveRange, type ScheduleData, tonight } from '../../shared/domain/schedule'
import * as s from '../database/schema'
import type { Database } from '../utils/db'

export async function loadScheduleData(db: Database): Promise<ScheduleData> {
  const [locations, seasons, slots, exceptions] = await Promise.all([
    db.select().from(s.locations),
    db.select().from(s.seasons).where(isNull(s.seasons.archivedAt)),
    db.select().from(s.scheduleSlots),
    db.select().from(s.scheduleExceptions).where(isNull(s.scheduleExceptions.archivedAt)),
  ])
  return {
    locations: locations.map(l => ({ id: l.id, slug: l.slug, name: l.name, address: l.address, city: l.city, zip: l.zip, lat: l.lat, lng: l.lng })),
    seasons: seasons.map(season => ({
      id: season.id,
      name: season.name,
      startsOn: season.startsOn,
      endsOn: season.endsOn,
      priority: season.priority,
      isDefault: season.isDefault,
      slots: slots.filter(sl => sl.seasonId === season.id).map(sl => ({ weekday: sl.weekday, locationId: sl.locationId, opensAt: sl.opensAt, closesAt: sl.closesAt })),
    })),
    exceptions: exceptions.map(e => ({ id: e.id, kind: e.kind, startsOn: e.startsOn, endsOn: e.endsOn, locationId: e.locationId, opensAt: e.opensAt, closesAt: e.closesAt, note: e.note })),
  }
}

export type IngredientView = Pick<typeof s.ingredients.$inferSelect, 'id' | 'slug' | 'name' | 'kind' | 'allergens' | 'i18n'>

export interface PizzaView {
  id: string
  slug: string
  name: string
  baseKind: typeof s.pizzas.$inferSelect['baseKind']
  baseLabel: string
  priceCents: number
  imageUrl: string | null
  imageAlt: string | null
  avant: IngredientView[]
  apres: IngredientView[]
  allergens: Allergen[]
  extraAllergens: Allergen[]
  tags: { vegetarian: boolean, meat: boolean, fish: boolean }
  i18n: typeof s.pizzas.$inferSelect['i18n']
  archived: boolean
}

/** Pizzas avec ingrédients, allergènes dérivés et étiquettes de filtre */
export async function loadPizzas(db: Database, ids?: string[]): Promise<PizzaView[]> {
  const pizzas = ids
    ? ids.length ? await db.select().from(s.pizzas).where(inArray(s.pizzas.id, ids)) : []
    : await db.select().from(s.pizzas).orderBy(asc(s.pizzas.name))
  if (!pizzas.length) return []

  const links = await db.select({
    pizzaId: s.pizzaIngredients.pizzaId,
    stage: s.pizzaIngredients.stage,
    position: s.pizzaIngredients.position,
    ingredient: {
      id: s.ingredients.id,
      slug: s.ingredients.slug,
      name: s.ingredients.name,
      kind: s.ingredients.kind,
      allergens: s.ingredients.allergens,
      i18n: s.ingredients.i18n,
    },
  })
    .from(s.pizzaIngredients)
    .innerJoin(s.ingredients, eq(s.ingredients.id, s.pizzaIngredients.ingredientId))
    .where(inArray(s.pizzaIngredients.pizzaId, pizzas.map(p => p.id)))
    .orderBy(asc(s.pizzaIngredients.position))

  return pizzas.map((p) => {
    const own = links.filter(l => l.pizzaId === p.id)
    const avant = own.filter(l => l.stage === 'avant').map(l => l.ingredient)
    const apres = own.filter(l => l.stage === 'apres').map(l => l.ingredient)
    const all = [...avant, ...apres]
    const allergens = new Set<Allergen>([...DOUGH_ALLERGENS, ...p.extraAllergens, ...all.flatMap(i => i.allergens)])
    if (p.baseKind === 'creme') allergens.add('lait')
    const meat = all.some(i => i.kind === 'viande')
    const fish = all.some(i => i.kind === 'poisson')
    return {
      id: p.id,
      slug: p.slug,
      name: p.name,
      baseKind: p.baseKind,
      baseLabel: p.baseLabel,
      priceCents: p.priceCents,
      imageUrl: p.imageUrl,
      imageAlt: p.imageAlt,
      avant,
      apres,
      allergens: [...allergens].sort(),
      extraAllergens: p.extraAllergens,
      tags: { vegetarian: !meat && !fish, meat, fish },
      i18n: p.i18n,
      archived: Boolean(p.archivedAt),
    }
  })
}

export interface MenuView {
  id: string
  slug: string
  name: string
  tagline: string | null
  i18n: typeof s.menus.$inferSelect['i18n']
  sections: { section: MenuSection, pizzas: PizzaView[] }[]
}

export async function loadMenu(db: Database, menuId?: string): Promise<MenuView | null> {
  const [menu] = menuId
    ? await db.select().from(s.menus).where(eq(s.menus.id, menuId))
    : await db.select().from(s.menus).where(eq(s.menus.status, 'active')).limit(1)
  if (!menu) return null

  const items = await db.select().from(s.menuItems).where(eq(s.menuItems.menuId, menu.id)).orderBy(asc(s.menuItems.position))
  const pizzas = await loadPizzas(db, items.map(i => i.pizzaId))
  const byId = new Map(pizzas.map(p => [p.id, p]))
  const sections = (['rouges', 'blanches', 'speciales'] as const).map(section => ({
    section,
    pizzas: items.filter(i => i.section === section).map(i => byId.get(i.pizzaId)).filter((p): p is PizzaView => Boolean(p)),
  })).filter(sec => sec.pizzas.length)

  return { id: menu.id, slug: menu.slug, name: menu.name, tagline: menu.tagline, i18n: menu.i18n, sections }
}

export async function loadFeatured(db: Database, date = isoDateInParis()) {
  const rows = await db.select().from(s.featuredPizzas)
    .where(isNull(s.featuredPizzas.archivedAt))
    .orderBy(desc(s.featuredPizzas.priority))
  const active = rows.filter(f => isWithin(date, f.startsOn, f.endsOn))
  const pizzas = await loadPizzas(db, active.map(f => f.pizzaId))
  return active.map(f => ({ ...f, pizza: pizzas.find(p => p.id === f.pizzaId)! })).filter(f => f.pizza)
}

export async function loadSettings(db: Database): Promise<Record<string, any>> { // eslint-disable-line @typescript-eslint/no-explicit-any
  const rows = await db.select().from(s.settings)
  return Object.fromEntries(rows.map(r => [r.key, r.value]))
}

/** Tout ce dont le site public a besoin, en une requête */
export async function loadPublicSnapshot(db: Database, now = new Date()) {
  const [schedule, menu, featured, settings, drinks, supplements, desserts, messages] = await Promise.all([
    loadScheduleData(db),
    loadMenu(db),
    loadFeatured(db, isoDateInParis(now)),
    loadSettings(db),
    db.select().from(s.drinks).where(isNull(s.drinks.archivedAt)).orderBy(asc(s.drinks.position)),
    db.select().from(s.supplements).where(isNull(s.supplements.archivedAt)).orderBy(asc(s.supplements.position)),
    db.select().from(s.desserts).where(isNull(s.desserts.archivedAt)).orderBy(asc(s.desserts.position)),
    db.select().from(s.modalMessages).where(and(isNull(s.modalMessages.archivedAt), eq(s.modalMessages.enabled, true))),
  ])

  const today = isoDateInParis(now)
  const modal = pickModalMessage(messages, now.toISOString())
  // Règle métier : le public ne voit que l'heure d'ouverture (« dès 18h »), jamais la fermeture
  const publicDay = <T extends { closesAt: string | null } | null>(day: T): T => (day ? { ...day, closesAt: null } : day)
  const tonightState = tonight(schedule, now)
  const featuredInModal = featured.filter(f => f.showInModal)

  return {
    generatedAt: now.toISOString(),
    settings,
    tonight: { ...tonightState, today: publicDay(tonightState.today), next: publicDay(tonightState.next) },
    week: resolveRange(schedule, today, 14).map(publicDay),
    locations: schedule.locations,
    menu,
    featured,
    drinks: drinks.map(({ createdAt: _c, updatedAt: _u, archivedAt: _a, ...d }) => d),
    supplements: supplements.map(({ createdAt: _c, updatedAt: _u, archivedAt: _a, ...d }) => d),
    desserts: settings['site.features']?.desserts ? desserts : [],
    modal: modal
      ? { id: modal.id, kind: modal.kind, title: modal.title, body: modal.body, imageUrl: modal.imageUrl, ctas: modal.ctas, i18n: modal.i18n, updatedAt: modal.updatedAt }
      : featuredInModal[0]
        ? { id: `featured-${featuredInModal[0].id}`, kind: 'featured' as const, title: featuredInModal[0].title, body: featuredInModal[0].pitch ?? '', imageUrl: featuredInModal[0].pizza.imageUrl, ctas: [{ label: 'Voir la carte', href: '/la-carte', variant: 'primary' as const }], i18n: featuredInModal[0].i18n, updatedAt: featuredInModal[0].updatedAt }
        : null,
  }
}

export type PublicSnapshot = Awaited<ReturnType<typeof loadPublicSnapshot>>
