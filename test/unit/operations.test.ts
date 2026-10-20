import { readFile } from 'node:fs/promises'
import { createClient } from '@libsql/client'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { beforeEach, describe, expect, it } from 'vitest'
import { runMigrations } from '../../server/database/migrate'
import * as schema from '../../server/database/schema'
import { seedDatabase } from '../../server/database/seed'
import { loadMenu, loadPublicSnapshot } from '../../server/services/catalog'
import { applyOperations, commitOperations, proposeChangeset, publishChangeset, type Actor } from '../../server/services/operations'

const actor: Actor = { type: 'user', id: null, label: 'test' }

async function freshDb() {
  const client = createClient({ url: ':memory:' })
  await runMigrations(client, name => readFile(new URL(`../../server/database/migrations/${name}`, import.meta.url), 'utf8'))
  const db = drizzle(client, { schema })
  await seedDatabase(db)
  return db
}

describe('moteur d’écriture', () => {
  let db: Awaited<ReturnType<typeof freshDb>>
  beforeEach(async () => {
    db = await freshDb()
  })

  it('importe la carte actuelle', async () => {
    const menu = await loadMenu(db)
    expect(menu?.name).toBe('Automne-Hiver 2026')
    expect(menu?.sections.flatMap(s => s.pizzas)).toHaveLength(16)
  })

  it('crée une pizza avec ses ingrédients via un alias, ingrédients inconnus créés', async () => {
    const result = await commitOperations(db, 'Nouvelle PDM', [
      { op: 'create', entity: 'pizza', ref: '$pdm', data: { slug: 'la-truffe', name: 'La Truffe', baseKind: 'creme', baseLabel: 'Crème fraîche', priceCents: 1950 } },
      { op: 'setPizzaIngredients', pizzaId: '$pdm', avant: ['Mozzarella Fior di Latte'], apres: ['Copeaux de truffe noire'] },
      { op: 'create', entity: 'featured', data: { pizzaId: '$pdm', showInModal: true } },
    ], actor)
    expect(result.revisions).toBeGreaterThanOrEqual(4)

    const snapshot = await loadPublicSnapshot(db)
    expect(snapshot.featured[0]?.pizza.name).toBe('La Truffe')
    expect(snapshot.featured[0]?.pizza.apres.map(i => i.name)).toEqual(['Copeaux de truffe noire'])
  })

  it('un brouillon ne change rien avant publication', async () => {
    const draft = await proposeChangeset(db, 'Prix Margherita', [
      { op: 'update', entity: 'pizza', id: 'la-margherita', data: { priceCents: 1200 } },
    ], actor)
    let [pizza] = await db.select().from(schema.pizzas).where(eq(schema.pizzas.slug, 'la-margherita'))
    expect(pizza?.priceCents).toBe(1150)

    await publishChangeset(db, draft.id, actor)
    ;[pizza] = await db.select().from(schema.pizzas).where(eq(schema.pizzas.slug, 'la-margherita'))
    expect(pizza?.priceCents).toBe(1200)
  })

  it('restaure une révision', async () => {
    await applyOperations(db, [{ op: 'update', entity: 'pizza', id: 'la-margherita', data: { priceCents: 1300 } }], actor)
    const [rev] = await db.select().from(schema.revisions).where(eq(schema.revisions.entity, 'pizza'))
    await applyOperations(db, [{ op: 'restoreRevision', revisionId: rev!.id }], actor)
    const [pizza] = await db.select().from(schema.pizzas).where(eq(schema.pizzas.slug, 'la-margherita'))
    expect(pizza?.priceCents).toBe(1150)
  })

  it('annule tout si une opération échoue', async () => {
    await expect(applyOperations(db, [
      { op: 'update', entity: 'pizza', id: 'la-margherita', data: { priceCents: 999 } },
      { op: 'update', entity: 'pizza', id: 'pizza-inexistante', data: { priceCents: 1 } },
    ], actor)).rejects.toThrow(/Opération 2/)
    const [pizza] = await db.select().from(schema.pizzas).where(eq(schema.pizzas.slug, 'la-margherita'))
    expect(pizza?.priceCents).toBe(1150)
  })

  it('active une nouvelle carte et archive l’ancienne', async () => {
    await commitOperations(db, 'Carte été', [
      { op: 'create', entity: 'menu', ref: '$ete', data: { slug: 'ete-2027', name: 'Été 2027' } },
      { op: 'setMenuItems', menuId: '$ete', items: [{ pizzaId: 'la-margherita', section: 'rouges', position: 0 }] },
      { op: 'activateMenu', menuId: '$ete' },
    ], actor)
    const menu = await loadMenu(db)
    expect(menu?.name).toBe('Été 2027')
    const [old] = await db.select().from(schema.menus).where(eq(schema.menus.slug, 'automne-hiver-2026'))
    expect(old?.status).toBe('archived')
  })
})

describe('instantané public', () => {
  it('ne publie jamais l’heure de fermeture', async () => {
    const db = await freshDb()
    const snap = await loadPublicSnapshot(db, new Date('2026-10-21T16:00:00Z'))
    expect(snap.tonight.today.closesAt).toBeNull()
    expect(snap.week.every(d => d.closesAt === null)).toBe(true)
    expect(snap.tonight.status).toBe('opens-later')
  })
})
