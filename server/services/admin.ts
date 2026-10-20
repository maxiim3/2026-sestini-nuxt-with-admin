import { asc, desc, eq, isNull } from 'drizzle-orm'
import { ENTITY_NAMES, type EntityName } from '../../shared/schemas'
import * as s from '../database/schema'
import type { Database } from '../utils/db'
import { loadPizzas } from './catalog'

const LIST_TABLES = {
  location: s.locations,
  season: s.seasons,
  scheduleException: s.scheduleExceptions,
  ingredient: s.ingredients,
  pizza: s.pizzas,
  menu: s.menus,
  featured: s.featuredPizzas,
  supplement: s.supplements,
  drink: s.drinks,
  dessert: s.desserts,
  modalMessage: s.modalMessages,
} as const satisfies Record<EntityName, unknown>

export function isEntity(value: string): value is EntityName {
  return (ENTITY_NAMES as string[]).includes(value)
}

/** Liste brute d'une entité, archives comprises (champ archivedAt) */
export async function listEntity(db: Database, entity: EntityName) {
  const table = LIST_TABLES[entity]
  const rows = await db.select().from(table)
  return rows
}

export async function loadAdminMenus(db: Database) {
  const menus = await db.select().from(s.menus).orderBy(desc(s.menus.createdAt))
  const items = await db.select().from(s.menuItems).orderBy(asc(s.menuItems.position))
  return menus.map(m => ({ ...m, items: items.filter(i => i.menuId === m.id) }))
}

export async function loadAdminPizzas(db: Database) {
  return loadPizzas(db)
}

export async function loadSchedule(db: Database) {
  const [locations, seasons, slots, exceptions] = await Promise.all([
    db.select().from(s.locations).orderBy(asc(s.locations.city)),
    db.select().from(s.seasons).orderBy(desc(s.seasons.isDefault), asc(s.seasons.startsOn)),
    db.select().from(s.scheduleSlots).orderBy(asc(s.scheduleSlots.weekday)),
    db.select().from(s.scheduleExceptions).where(isNull(s.scheduleExceptions.archivedAt)).orderBy(desc(s.scheduleExceptions.startsOn)),
  ])
  return { locations, seasons: seasons.map(se => ({ ...se, slots: slots.filter(sl => sl.seasonId === se.id) })), exceptions }
}

export async function loadRevisions(db: Database, opts: { entity?: string, entityId?: string, limit?: number }) {
  let query = db.select().from(s.revisions).$dynamic()
  if (opts.entity && opts.entityId) query = query.where(eq(s.revisions.entityId, opts.entityId))
  else if (opts.entity) query = query.where(eq(s.revisions.entity, opts.entity))
  return query.orderBy(desc(s.revisions.createdAt)).limit(opts.limit ?? 100)
}
