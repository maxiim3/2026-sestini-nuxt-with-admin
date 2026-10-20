/* eslint-disable @typescript-eslint/no-explicit-any -- accès générique aux tables Drizzle par nom d'entité */
import { and, eq, inArray, or } from 'drizzle-orm'
import type { SQLiteTable } from 'drizzle-orm/sqlite-core'
import { ENTITY_SCHEMAS, type EntityName, type Operation, operationSchema } from '../../shared/schemas'
import { slugify } from '../../shared/domain/text'
import type { Weekday } from '../../shared/domain/constants'
import * as s from '../database/schema'
import type { Database } from '../utils/db'

export interface Actor {
  type: s.ActorType
  id: string | null
  label: string
}

type Tx = Parameters<Parameters<Database['transaction']>[0]>[0]
type Row = Record<string, unknown> & { id: string }

/** Table et capacités de chaque entité générique */
const TABLES: Record<EntityName, { table: SQLiteTable & { id: any }, hasSlug: boolean, archivable: boolean }> = {
  location: { table: s.locations, hasSlug: true, archivable: true },
  season: { table: s.seasons, hasSlug: true, archivable: true },
  scheduleException: { table: s.scheduleExceptions, hasSlug: false, archivable: true },
  ingredient: { table: s.ingredients, hasSlug: true, archivable: true },
  pizza: { table: s.pizzas, hasSlug: true, archivable: true },
  menu: { table: s.menus, hasSlug: true, archivable: false },
  featured: { table: s.featuredPizzas, hasSlug: false, archivable: true },
  supplement: { table: s.supplements, hasSlug: false, archivable: true },
  drink: { table: s.drinks, hasSlug: false, archivable: true },
  dessert: { table: s.desserts, hasSlug: false, archivable: true },
  modalMessage: { table: s.modalMessages, hasSlug: false, archivable: true },
}

export class OperationError extends Error {
  constructor(message: string, public readonly index?: number) {
    super(index === undefined ? message : `Opération ${index + 1} : ${message}`)
  }
}

export interface ApplyResult {
  revisions: number
  created: Record<string, string>
}

interface Context {
  tx: Tx
  actor: Actor
  changesetId: string | null
  message: string | null
  refs: Map<string, string>
  revisions: number
}

async function record(ctx: Context, entity: string, entityId: string, action: typeof s.revisions.$inferInsert.action, before: unknown, after: unknown) {
  await ctx.tx.insert(s.revisions).values({
    entity,
    entityId,
    action,
    before: (before ?? null) as Record<string, unknown> | null,
    after: (after ?? null) as Record<string, unknown> | null,
    changesetId: ctx.changesetId,
    authorType: ctx.actor.type,
    authorId: ctx.actor.id,
    authorLabel: ctx.actor.label,
    message: ctx.message,
  })
  ctx.revisions++
}

/** Retrouve une ligne par id, slug ou alias « $ref » d'une opération précédente */
async function findRow(ctx: Context, entity: EntityName, key: string): Promise<Row> {
  const { table, hasSlug } = TABLES[entity]
  const id = key.startsWith('$') ? ctx.refs.get(key) : key
  if (!id) throw new OperationError(`alias inconnu ${key}`)
  const t = table as any
  const where = hasSlug ? or(eq(t.id, id), eq(t.slug, id)) : eq(t.id, id)
  const [row] = await ctx.tx.select().from(table).where(where).limit(1)
  if (!row) throw new OperationError(`${entity} introuvable : ${key}`)
  return row as Row
}

function resolveId(ctx: Context, key: string): string {
  if (!key.startsWith('$')) return key
  const id = ctx.refs.get(key)
  if (!id) throw new OperationError(`alias inconnu ${key}`)
  return id
}

/** Remplace les alias « $ref » dans les champs *Id d'un objet */
function resolveRefs(ctx: Context, data: Record<string, unknown>) {
  return Object.fromEntries(Object.entries(data).map(([k, v]) =>
    [k, typeof v === 'string' && v.startsWith('$') && k.endsWith('Id') ? resolveId(ctx, v) : v]))
}

async function pizzaIngredientsSnapshot(tx: Tx, pizzaId: string) {
  const rows = await tx.select({ id: s.pizzaIngredients.ingredientId, stage: s.pizzaIngredients.stage, position: s.pizzaIngredients.position })
    .from(s.pizzaIngredients).where(eq(s.pizzaIngredients.pizzaId, pizzaId))
  const sorted = rows.sort((a, b) => a.position - b.position)
  return {
    avant: sorted.filter(r => r.stage === 'avant').map(r => r.id),
    apres: sorted.filter(r => r.stage === 'apres').map(r => r.id),
  }
}

/** Résout une liste d'ingrédients (id, slug ou nom) en ids, en créant ceux qui n'existent pas */
async function resolveIngredients(ctx: Context, keys: string[]): Promise<string[]> {
  const ids: string[] = []
  for (const key of keys) {
    const id = key.startsWith('$') ? resolveId(ctx, key) : key
    const slug = slugify(id)
    const [found] = await ctx.tx.select().from(s.ingredients)
      .where(or(eq(s.ingredients.id, id), eq(s.ingredients.slug, id), eq(s.ingredients.slug, slug))).limit(1)
    if (found) {
      ids.push(found.id)
      continue
    }
    const [created] = await ctx.tx.insert(s.ingredients).values({ slug, name: key.trim() }).returning()
    await record(ctx, 'ingredient', created!.id, 'create', null, created)
    ids.push(created!.id)
  }
  return ids
}

async function applyOne(ctx: Context, op: Operation, created: Record<string, string>) {
  switch (op.op) {
    case 'create': {
      const { table } = TABLES[op.entity]
      const data = ENTITY_SCHEMAS[op.entity].parse(resolveRefs(ctx, op.data))
      const [row] = await ctx.tx.insert(table).values(data as any).returning()
      const id = (row as Row).id
      if (op.ref) ctx.refs.set(op.ref.startsWith('$') ? op.ref : `$${op.ref}`, id)
      created[op.ref ?? `${op.entity}:${Object.keys(created).length}`] = id
      await record(ctx, op.entity, id, 'create', null, row)
      return
    }
    case 'update': {
      const { table } = TABLES[op.entity]
      const before = await findRow(ctx, op.entity, op.id)
      const data = ENTITY_SCHEMAS[op.entity].partial().parse(resolveRefs(ctx, op.data))
      const [after] = await ctx.tx.update(table).set(data as any).where(eq((table as any).id, before.id)).returning()
      await record(ctx, op.entity, before.id, 'update', before, after)
      return
    }
    case 'archive':
    case 'restore': {
      const { table, archivable } = TABLES[op.entity]
      if (!archivable) throw new OperationError(`${op.entity} ne s'archive pas`)
      const before = await findRow(ctx, op.entity, op.id)
      const archivedAt = op.op === 'archive' ? new Date().toISOString() : null
      const [after] = await ctx.tx.update(table).set({ archivedAt } as any).where(eq((table as any).id, before.id)).returning()
      await record(ctx, op.entity, before.id, op.op, before, after)
      return
    }
    case 'delete': {
      const { table } = TABLES[op.entity]
      const before = await findRow(ctx, op.entity, op.id)
      await ctx.tx.delete(table).where(eq((table as any).id, before.id))
      await record(ctx, op.entity, before.id, 'delete', before, null)
      return
    }
    case 'setPizzaIngredients': {
      const pizza = await findRow(ctx, 'pizza', op.pizzaId)
      const before = await pizzaIngredientsSnapshot(ctx.tx, pizza.id)
      const avant = await resolveIngredients(ctx, op.avant)
      const apres = await resolveIngredients(ctx, op.apres)
      await ctx.tx.delete(s.pizzaIngredients).where(eq(s.pizzaIngredients.pizzaId, pizza.id))
      const rows = [
        ...avant.map((ingredientId, position) => ({ pizzaId: pizza.id, ingredientId, stage: 'avant' as const, position })),
        ...apres.map((ingredientId, position) => ({ pizzaId: pizza.id, ingredientId, stage: 'apres' as const, position })),
      ]
      if (rows.length) await ctx.tx.insert(s.pizzaIngredients).values(rows)
      await record(ctx, 'pizzaIngredients', pizza.id, 'update', before, { avant, apres })
      return
    }
    case 'setScheduleSlots': {
      const season = await findRow(ctx, 'season', op.seasonId)
      const before = await ctx.tx.select().from(s.scheduleSlots).where(eq(s.scheduleSlots.seasonId, season.id))
      const days = new Set(op.slots.map(sl => sl.weekday))
      if (days.size !== op.slots.length) throw new OperationError('un même jour apparaît deux fois')
      await ctx.tx.delete(s.scheduleSlots).where(eq(s.scheduleSlots.seasonId, season.id))
      const slots = []
      for (const slot of op.slots) {
        const location = await findRow(ctx, 'location', slot.locationId)
        slots.push({ ...slot, weekday: slot.weekday as Weekday, seasonId: season.id, locationId: location.id })
      }
      if (slots.length) await ctx.tx.insert(s.scheduleSlots).values(slots)
      await record(ctx, 'scheduleSlots', season.id, 'update', { slots: before }, { slots })
      return
    }
    case 'setMenuItems': {
      const menu = await findRow(ctx, 'menu', op.menuId)
      const before = await ctx.tx.select().from(s.menuItems).where(eq(s.menuItems.menuId, menu.id))
      await ctx.tx.delete(s.menuItems).where(eq(s.menuItems.menuId, menu.id))
      const items = []
      for (const item of op.items) {
        const pizza = await findRow(ctx, 'pizza', item.pizzaId)
        items.push({ ...item, menuId: menu.id, pizzaId: pizza.id })
      }
      if (items.length) await ctx.tx.insert(s.menuItems).values(items)
      await record(ctx, 'menuItems', menu.id, 'update', { items: before }, { items })
      return
    }
    case 'activateMenu': {
      const menu = await findRow(ctx, 'menu', op.menuId)
      const actives = await ctx.tx.select().from(s.menus).where(eq(s.menus.status, 'active'))
      for (const previous of actives.filter(m => m.id !== menu.id)) {
        const [after] = await ctx.tx.update(s.menus).set({ status: 'archived' }).where(eq(s.menus.id, previous.id)).returning()
        await record(ctx, 'menu', previous.id, 'update', previous, after)
      }
      const [after] = await ctx.tx.update(s.menus).set({ status: 'active', activatesOn: null }).where(eq(s.menus.id, menu.id)).returning()
      await record(ctx, 'menu', menu.id, 'update', menu, after)
      return
    }
    case 'setSetting': {
      const [before] = await ctx.tx.select().from(s.settings).where(eq(s.settings.key, op.key))
      await ctx.tx.insert(s.settings).values({ key: op.key, value: op.value })
        .onConflictDoUpdate({ target: s.settings.key, set: { value: op.value, updatedAt: new Date().toISOString() } })
      await record(ctx, 'setting', op.key, before ? 'update' : 'create', before ? { value: before.value } : null, { value: op.value })
      return
    }
    case 'restoreRevision': {
      const [rev] = await ctx.tx.select().from(s.revisions).where(eq(s.revisions.id, op.revisionId))
      if (!rev) throw new OperationError(`révision introuvable : ${op.revisionId}`)
      await restoreRevision(ctx, rev, created)
      return
    }
  }
}

/** Remet une entité dans l'état « avant » d'une révision */
async function restoreRevision(ctx: Context, rev: typeof s.revisions.$inferSelect, created: Record<string, string>) {
  const before = rev.before as Record<string, any> | null
  switch (rev.entity) {
    case 'pizzaIngredients':
      return applyOne(ctx, { op: 'setPizzaIngredients', pizzaId: rev.entityId, avant: before?.avant ?? [], apres: before?.apres ?? [] }, created)
    case 'scheduleSlots':
      return applyOne(ctx, { op: 'setScheduleSlots', seasonId: rev.entityId, slots: before?.slots ?? [] }, created)
    case 'menuItems':
      return applyOne(ctx, { op: 'setMenuItems', menuId: rev.entityId, items: before?.items ?? [] }, created)
    case 'setting':
      return applyOne(ctx, { op: 'setSetting', key: rev.entityId, value: before?.value ?? null }, created)
  }

  const entity = rev.entity as EntityName
  const meta = TABLES[entity]
  if (!meta) throw new OperationError(`révision non restaurable (${rev.entity})`)
  const table = meta.table as any

  if (!before) {
    // Annuler une création : on archive (ou supprime si l'entité ne s'archive pas)
    if (meta.archivable) return applyOne(ctx, { op: 'archive', entity, id: rev.entityId }, created)
    await ctx.tx.delete(table).where(eq(table.id, rev.entityId))
    await record(ctx, entity, rev.entityId, 'delete', rev.after, null)
    return
  }

  const [current] = await ctx.tx.select().from(table).where(eq(table.id, rev.entityId))
  const { createdAt: _c, updatedAt: _u, ...values } = before
  if (current) {
    const [after] = await ctx.tx.update(table).set(values).where(eq(table.id, rev.entityId)).returning() as Row[]
    await record(ctx, entity, rev.entityId, 'restore', current, after)
  }
  else {
    const [after] = await ctx.tx.insert(table).values(values).returning() as Row[]
    await record(ctx, entity, rev.entityId, 'restore', null, after)
  }
}

/** Applique une liste d'opérations dans une transaction, en enregistrant une révision par changement */
export async function applyOperations(
  db: Database,
  rawOps: unknown[],
  actor: Actor,
  options: { changesetId?: string | null, message?: string | null } = {},
): Promise<ApplyResult> {
  const ops = rawOps.map((op, i) => {
    const parsed = operationSchema.safeParse(op)
    if (!parsed.success) throw new OperationError(parsed.error.issues.map(e => `${e.path.join('.')} ${e.message}`).join(' ; '), i)
    return parsed.data
  })

  return db.transaction(async (tx) => {
    const ctx: Context = { tx, actor, changesetId: options.changesetId ?? null, message: options.message ?? null, refs: new Map(), revisions: 0 }
    const created: Record<string, string> = {}
    for (const [i, op] of ops.entries()) {
      try {
        await applyOne(ctx, op, created)
      }
      catch (error) {
        if (error instanceof OperationError && error.index !== undefined) throw error
        const message = error instanceof Error ? error.message : String(error)
        throw new OperationError(message, i)
      }
    }
    return { revisions: ctx.revisions, created }
  })
}

// ─── Changesets (brouillons) ─────────────────────────────────────────────

export async function proposeChangeset(db: Database, title: string, rawOps: unknown[], actor: Actor) {
  // Validation de forme dès la proposition, pour ne pas stocker de brouillon invalide
  rawOps.forEach((op, i) => {
    const parsed = operationSchema.safeParse(op)
    if (!parsed.success) throw new OperationError(parsed.error.issues.map(e => `${e.path.join('.')} ${e.message}`).join(' ; '), i)
  })
  const [changeset] = await db.insert(s.changesets).values({
    title,
    operations: rawOps,
    authorType: actor.type,
    authorId: actor.id,
    authorLabel: actor.label,
  }).returning()
  return changeset!
}

export async function publishChangeset(db: Database, id: string, actor: Actor) {
  const [changeset] = await db.select().from(s.changesets).where(and(eq(s.changesets.id, id), eq(s.changesets.status, 'draft')))
  if (!changeset) throw new OperationError('brouillon introuvable ou déjà traité')
  try {
    const result = await applyOperations(db, changeset.operations, actor, { changesetId: id, message: changeset.title })
    await db.update(s.changesets).set({ status: 'published', decidedAt: new Date().toISOString(), decidedBy: actor.label, error: null })
      .where(eq(s.changesets.id, id))
    return result
  }
  catch (error) {
    await db.update(s.changesets).set({ error: error instanceof Error ? error.message : String(error) }).where(eq(s.changesets.id, id))
    throw error
  }
}

export async function discardChangeset(db: Database, id: string, actor: Actor) {
  const [row] = await db.update(s.changesets)
    .set({ status: 'discarded', decidedAt: new Date().toISOString(), decidedBy: actor.label })
    .where(and(eq(s.changesets.id, id), eq(s.changesets.status, 'draft'))).returning()
  if (!row) throw new OperationError('brouillon introuvable ou déjà traité')
  return row
}

/** Écrit directement (changeset publié immédiatement) : garde une trace homogène dans l'historique */
export async function commitOperations(db: Database, title: string, rawOps: unknown[], actor: Actor) {
  const changeset = await proposeChangeset(db, title, rawOps, actor)
  const result = await publishChangeset(db, changeset.id, actor)
  return { changesetId: changeset.id, ...result }
}

export async function revisionsFor(db: Database, entity: string, ids: string[]) {
  if (!ids.length) return []
  return db.select().from(s.revisions).where(and(eq(s.revisions.entity, entity), inArray(s.revisions.entityId, ids)))
}
