import { and, asc, desc, eq, isNull, or } from 'drizzle-orm'
import { addDays, isoDateInParis, isoWeekday, isWithin } from '../../shared/domain/dates'
import type { PrintModel } from '../../shared/domain/print'
import { activeSeason, nextOpenDay, resolveRange, type ScheduleData } from '../../shared/domain/schedule'
import * as s from '../database/schema'
import type { Database } from '../utils/db'
import { loadFeatured, loadMenu, loadPizzas, loadScheduleData, loadSettings } from './catalog'

/**
 * Données des documents imprimables (/print/<modele>). Lecture seule, contenu
 * public uniquement : la page d'impression traduit et met en forme.
 */

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

function isoDate(value: string | undefined): string | undefined {
  return value && DATE_RE.test(value) ? value : undefined
}

type MessageRow = typeof s.modalMessages.$inferSelect

function messageView(m: MessageRow | undefined | null) {
  return m ? { id: m.id, kind: m.kind, title: m.title, body: m.body, imageUrl: m.imageUrl, i18n: m.i18n } : null
}

/** Message explicite (id), aucun (« none »), ou le message du bon type dont la fenêtre recouvre la période */
async function findMessage(db: Database, id: string | undefined, kind: MessageRow['kind'], from: string | null, to: string | null) {
  if (id === 'none') return null
  if (id) {
    const [row] = await db.select().from(s.modalMessages).where(eq(s.modalMessages.id, id))
    return messageView(row)
  }
  if (!from || !to) return null
  const rows = await db.select().from(s.modalMessages)
    .where(and(eq(s.modalMessages.kind, kind), isNull(s.modalMessages.archivedAt), eq(s.modalMessages.enabled, true)))
    .orderBy(desc(s.modalMessages.priority), desc(s.modalMessages.updatedAt))
  return messageView(rows.find(m => (!m.startsAt || m.startsAt.slice(0, 10) <= to) && (!m.endsAt || m.endsAt.slice(0, 10) >= from)))
}

/** Semaine type (saison active à la date) : un créneau par jour ouvert */
function typicalWeek(schedule: ScheduleData, date: string) {
  const season = activeSeason(schedule.seasons, date)
  return (season?.slots ?? [])
    .map(slot => ({ weekday: slot.weekday, opensAt: slot.opensAt, location: schedule.locations.find(l => l.id === slot.locationId) ?? null }))
    .sort((a, b) => a.weekday - b.weekday)
}

async function loadCommon(db: Database, today: string) {
  const [settings, schedule] = await Promise.all([loadSettings(db), loadScheduleData(db)])
  const contact = (settings['site.contact'] ?? {}) as { phone?: string, email?: string, instagram?: string, facebook?: string }
  return {
    schedule,
    common: {
      today,
      contact: {
        phone: contact.phone ?? '',
        email: contact.email ?? '',
        instagram: contact.instagram ?? '',
        facebook: contact.facebook ?? '',
      },
      typicalWeek: typicalWeek(schedule, today),
    },
  }
}

async function loadCarte(db: Database, params: Record<string, string>, today: string) {
  const [menu, featured, supplements, drinks, desserts, settings] = await Promise.all([
    loadMenu(db, params.menu),
    loadFeatured(db, today),
    db.select().from(s.supplements).where(isNull(s.supplements.archivedAt)).orderBy(asc(s.supplements.position)),
    db.select().from(s.drinks).where(isNull(s.drinks.archivedAt)).orderBy(asc(s.drinks.position)),
    db.select().from(s.desserts).where(isNull(s.desserts.archivedAt)).orderBy(asc(s.desserts.position)),
    loadSettings(db),
  ])
  return {
    menu,
    featured: featured.filter(f => f.showOnMenu).map(f => ({ id: f.id, title: f.title, pitch: f.pitch, i18n: f.i18n, pizza: f.pizza })),
    supplements: supplements.map(x => ({ id: x.id, label: x.label, priceCents: x.priceCents, i18n: x.i18n })),
    drinks: drinks.map(d => ({ id: d.id, name: d.name, volume: d.volume, category: d.category, priceCents: d.priceCents, i18n: d.i18n })),
    desserts: settings['site.features']?.desserts
      ? desserts.map(d => ({ id: d.id, name: d.name, description: d.description, priceCents: d.priceCents, allergens: d.allergens, i18n: d.i18n }))
      : [],
  }
}

async function loadPizzaDuMoment(db: Database, params: Record<string, string>, today: string) {
  const featuredRows = await db.select().from(s.featuredPizzas).orderBy(desc(s.featuredPizzas.priority), desc(s.featuredPizzas.createdAt))
  let featured = params.featured ? featuredRows.find(f => f.id === params.featured) : undefined
  let pizzaId: string | undefined

  if (params.pizza) {
    const [row] = await db.select({ id: s.pizzas.id }).from(s.pizzas).where(or(eq(s.pizzas.id, params.pizza), eq(s.pizzas.slug, params.pizza)))
    pizzaId = row?.id
    featured ??= featuredRows.find(f => f.pizzaId === pizzaId)
  }
  else {
    // Pizza du moment en cours, sinon la plus récente (y compris archivée)
    featured ??= featuredRows.find(f => !f.archivedAt && isWithin(today, f.startsOn, f.endsOn))
      ?? featuredRows.find(f => !f.archivedAt)
      ?? featuredRows[0]
    pizzaId = featured?.pizzaId
  }

  const [pizza] = pizzaId ? await loadPizzas(db, [pizzaId]) : []
  return {
    featured: featured
      ? {
          id: featured.id,
          title: featured.title,
          // Les accroches des archives sont des notes internes (« Archive : … »)
          pitch: featured.archivedAt ? null : featured.pitch,
          startsOn: featured.startsOn,
          endsOn: featured.endsOn,
          archived: Boolean(featured.archivedAt),
          i18n: featured.i18n,
        }
      : null,
    pizza: pizza ?? null,
  }
}

async function exceptionsWithI18n(db: Database) {
  return db.select().from(s.scheduleExceptions).where(isNull(s.scheduleExceptions.archivedAt)).orderBy(asc(s.scheduleExceptions.startsOn))
}

async function loadFermeture(db: Database, params: Record<string, string>, today: string, schedule: ScheduleData) {
  const exceptions = (await exceptionsWithI18n(db)).filter(e => e.kind === 'closed')
  const from = isoDate(params.from)
  let closure: { id: string | null, startsOn: string, endsOn: string, note: string | null, i18n: typeof exceptions[number]['i18n'] } | null = null

  if (from) {
    const to = isoDate(params.to)
    closure = { id: null, startsOn: from, endsOn: to && to >= from ? to : from, note: null, i18n: {} }
  }
  else {
    const row = params.exception
      ? exceptions.find(e => e.id === params.exception)
      : exceptions.find(e => e.endsOn >= today)
    if (row) closure = { id: row.id, startsOn: row.startsOn, endsOn: row.endsOn, note: row.note, i18n: row.i18n }
  }

  const reopening = closure ? nextOpenDay(schedule, addDays(closure.endsOn, 1)) : null
  const message = await findMessage(db, params.message, 'closure', closure?.startsOn ?? null, closure?.endsOn ?? null)
  return { closure, reopening, message }
}

async function loadEvenement(db: Database, params: Record<string, string>, today: string, schedule: ScheduleData) {
  const exceptions = (await exceptionsWithI18n(db)).filter(e => e.kind === 'relocated' || e.kind === 'extra')
  const row = params.exception
    ? exceptions.find(e => e.id === params.exception)
    : exceptions.find(e => e.endsOn >= today) ?? exceptions.at(-1)
  const location = row ? schedule.locations.find(l => l.id === row.locationId) ?? null : null
  const event = row
    ? { id: row.id, kind: row.kind, startsOn: row.startsOn, endsOn: row.endsOn, opensAt: row.opensAt ?? '18:00', note: row.note, i18n: row.i18n, location }
    : null
  const message = await findMessage(db, params.message, 'event', row?.startsOn ?? null, row?.endsOn ?? null)
  return { event, message }
}

async function loadSemaine(db: Database, params: Record<string, string>, today: string, schedule: ScheduleData) {
  const ref = isoDate(params.from) ?? today
  const monday = addDays(ref, 1 - isoWeekday(ref))
  const exceptions = await exceptionsWithI18n(db)
  const days = resolveRange(schedule, monday, 7).map(d => ({
    date: d.date,
    weekday: d.weekday,
    open: d.open,
    opensAt: d.opensAt,
    location: d.location,
    exception: d.exception
      ? { id: d.exception.id, kind: d.exception.kind, note: d.exception.note, i18n: exceptions.find(e => e.id === d.exception!.id)?.i18n ?? {} }
      : null,
  }))
  return { from: monday, to: addDays(monday, 6), days }
}

export async function loadPrintData(db: Database, model: PrintModel, params: Record<string, string>, now = new Date()) {
  const today = isoDateInParis(now)
  const { schedule, common } = await loadCommon(db, today)
  switch (model) {
    case 'carte':
      return { model, common, ...(await loadCarte(db, params, today)) }
    case 'pizza-du-moment':
      return { model, common, ...(await loadPizzaDuMoment(db, params, today)) }
    case 'fermeture':
      return { model, common, ...(await loadFermeture(db, params, today, schedule)) }
    case 'evenement':
      return { model, common, ...(await loadEvenement(db, params, today, schedule)) }
    case 'semaine':
      return { model, common, ...(await loadSemaine(db, params, today, schedule)) }
  }
}

export type PrintData = Awaited<ReturnType<typeof loadPrintData>>
