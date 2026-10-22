import { readFile } from 'node:fs/promises'
import { createClient } from '@libsql/client'
import { eq } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/libsql'
import { beforeEach, describe, expect, it } from 'vitest'
import { runMigrations } from '../../server/database/migrate'
import * as schema from '../../server/database/schema'
import { seedDatabase } from '../../server/database/seed'
import { applyImport, exportBackup, planImport, readBackupFile } from '../../server/services/backup'
import { backupToSheets, type Cell, type Sheet, sheetsToBackup } from '../../server/services/backup-sheets'
import type { Actor } from '../../server/services/operations'
import { writeWorkbook } from '../../server/utils/xlsx'
import { type Backup, validateBackup } from '../../shared/backup'

const actor: Actor = { type: 'user', id: null, label: 'test' }

async function freshDb() {
  const client = createClient({ url: ':memory:' })
  await runMigrations(client, name => readFile(new URL(`../../server/database/migrations/${name}`, import.meta.url), 'utf8'))
  const db = drizzle(client, { schema })
  await seedDatabase(db)
  return db
}

/** Sauvegarde passée par JSON puis validée, comme un fichier déposé dans l'atelier */
function reload(backup: Backup): Backup {
  const result = validateBackup(JSON.parse(JSON.stringify(backup)))
  if (!result.ok) throw new Error(result.errors.join('\n'))
  return result.backup
}

describe('sauvegarde', () => {
  let db: Awaited<ReturnType<typeof freshDb>>
  beforeEach(async () => {
    db = await freshDb()
  })

  it('exporte tout le contenu, sans comptes ni jetons', async () => {
    const backup = await exportBackup(db)
    expect(backup.pizzas.length).toBeGreaterThan(0)
    expect(backup.menus.some(m => m.items.length > 0)).toBe(true)
    expect(Object.keys(backup)).not.toEqual(expect.arrayContaining(['users']))
    expect(JSON.stringify(backup)).not.toMatch(/token|magic|audit/i)
  })

  it('un aller-retour sans modification ne change rien', async () => {
    const current = await exportBackup(db)
    const plan = planImport(current, reload(current))
    expect(plan.operations).toEqual([])
    expect(plan.changes).toEqual([])
  })

  it('détecte ajouts, modifications et suppressions, puis les applique', async () => {
    const current = await exportBackup(db)
    const incoming = reload(current)
    const margherita = incoming.pizzas.find(p => p.slug === 'la-margherita')!
    margherita.priceCents = 1250
    incoming.pizzas.push({ ...margherita, id: undefined, slug: 'la-nouvelle', name: 'La Nouvelle', avant: [margherita.avant[0]!], apres: [] })
    incoming.drinks.shift()
    incoming.featured.push({ pizza: 'la-nouvelle', title: 'La Pizza du Moment', showOnHome: true, showOnMenu: true, showInModal: false, priority: 0, archived: false })

    const plan = planImport(current, incoming)
    const kinds = plan.changes.map(c => `${c.section}:${c.kind}:${c.label}`)
    expect(kinds).toContain('pizzas:update:La Margherita')
    expect(kinds).toContain('pizzas:create:La Nouvelle')
    expect(kinds).toContain('featured:create:La Pizza du Moment (la-nouvelle)')
    expect(plan.changes.filter(c => c.section === 'drinks' && c.kind === 'archive')).toHaveLength(1)
    expect(plan.changes.find(c => c.label === 'La Margherita')?.fields).toEqual(['Prix (€)'])

    await applyImport(db, plan, 'Import', actor)
    const [pizza] = await db.select().from(schema.pizzas).where(eq(schema.pizzas.slug, 'la-margherita'))
    expect(pizza?.priceCents).toBe(1250)
    expect(pizza?.extraAllergens).toEqual(current.pizzas.find(p => p.slug === 'la-margherita')!.extraAllergens)

    // Une fois appliqué, le même fichier ne change plus rien
    const after = await exportBackup(db)
    expect(planImport(after, incoming).operations).toEqual([])
    const nouvelle = after.pizzas.find(p => p.slug === 'la-nouvelle')!
    expect(nouvelle.avant).toEqual([margherita.avant[0]])
    expect(after.featured.some(f => f.pizza === 'la-nouvelle')).toBe(true)
  })

  it('restaure une sauvegarde dans une base modifiée', async () => {
    const saved = await exportBackup(db)
    const [menu] = saved.menus.filter(m => m.status === 'active')
    await applyImport(db, planImport(saved, { ...reload(saved), menus: saved.menus.map(m => m.slug === menu!.slug ? { ...m, items: m.items.slice(2) } : m) }), 'Casse', actor)
    const plan = planImport(await exportBackup(db), reload(saved))
    expect(plan.changes).toEqual([expect.objectContaining({ section: 'menus', kind: 'update', fields: ['Pizzas'] })])
    await applyImport(db, plan, 'Restauration', actor)
    expect(planImport(await exportBackup(db), reload(saved)).operations).toEqual([])
  })
})

describe('validation d’un fichier', () => {
  it('refuse un fichier qui n’est pas une sauvegarde', () => {
    const result = validateBackup({ hello: 'world' })
    expect(result.ok).toBe(false)
    if (!result.ok) expect(result.errors[0]).toMatch(/pas une sauvegarde du site Sestini/)
  })

  it('signale les sections manquantes et les erreurs de champ en français', async () => {
    const backup = JSON.parse(JSON.stringify(await exportBackup(await freshDb())))
    delete backup.drinks
    backup.pizzas[0].priceCents = 'douze'
    const result = validateBackup(backup)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toContain('Section « Boissons » manquante')
    expect(result.errors.find(e => e.includes('Prix (€)'))).toMatch(new RegExp(`^Pizzas › « ${backup.pizzas[0].slug} » › Prix \\(€\\) : .*nombre attendu`))
  })

  it('refuse les liens vers des lignes absentes et les doublons', async () => {
    const backup = JSON.parse(JSON.stringify(await exportBackup(await freshDb())))
    backup.pizzas[0].avant.push('ingredient-inconnu')
    backup.ingredients.push({ ...backup.ingredients[0], id: undefined })
    const result = validateBackup(backup)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors.some(e => e.includes('ingrédient « ingredient-inconnu » absent'))).toBe(true)
    expect(result.errors.some(e => e.includes('en double'))).toBe(true)
  })
})

/** Ce qu'un tableur rend à la lecture : en-têtes en première ligne, cellules vides à null */
function asRead(sheets: Sheet[]) {
  return sheets.map(sh => ({ name: sh.name, rows: [sh.columns.map(c => c.header), ...sh.rows].map(r => r.map(c => c === '' || c === undefined ? null : c)) }))
}

function fromSheets(sheets: { name: string, rows: Cell[][] }[]) {
  const parsed = sheetsToBackup(sheets)
  const result = validateBackup(parsed.raw, parsed.locate)
  return { parsed, result }
}

describe('classeur Excel', () => {
  it('un aller-retour par un vrai fichier .xlsx ne change rien', async () => {
    const current = await exportBackup(await freshDb())
    const file = await writeWorkbook(backupToSheets(current))
    expect(file.subarray(0, 2).toString('latin1')).toBe('PK')
    const result = await readBackupFile(file)
    if (!result.ok) throw new Error(result.errors.join('\n'))
    expect(planImport(current, result.backup).operations).toEqual([])
  })

  it('refuse un fichier ni JSON ni Excel', async () => {
    expect(await readBackupFile(Buffer.from('nom;prix'))).toEqual({ ok: false, errors: [expect.stringMatching(/^Fichier illisible/)] })
    expect(await readBackupFile(Buffer.from('PK pas un classeur'))).toEqual({ ok: false, errors: [expect.stringMatching(/^Fichier Excel illisible/)] })
  })

  it('un onglet par type de données, lisible', async () => {
    const sheets = backupToSheets(await exportBackup(await freshDb()))
    expect(sheets.map(s => s.name)).toEqual(expect.arrayContaining(['Pizzas', 'Ingrédients', 'Cartes', 'Cartes – pizzas', 'Créneaux', 'Réglages', 'Messages du bandeau']))
    const pizzas = sheets.find(s => s.name === 'Pizzas')!
    const price = pizzas.columns.findIndex(c => c.header === 'Prix (€)')
    expect(pizzas.rows.map(r => r[price])).toContain(11.5)
  })

  it('un aller-retour par le classeur ne change rien', async () => {
    const current = await exportBackup(await freshDb())
    const { parsed, result } = fromSheets(asRead(backupToSheets(current)))
    expect(parsed.errors).toEqual([])
    if (!result.ok) throw new Error(result.errors.join('\n'))
    expect(planImport(current, result.backup).operations).toEqual([])
  })

  it('lit les saisies d’un humain : prix à virgule, oui/non, jours en toutes lettres, colonnes déplacées', async () => {
    const current = await exportBackup(await freshDb())
    const sheets = asRead(backupToSheets(current))
    const pizzas = sheets.find(s => s.name === 'Pizzas')!
    const [header] = pizzas.rows
    const price = header!.indexOf('Prix (€)')
    const slug = header!.indexOf('Slug')
    const line = pizzas.rows.findIndex(r => r[slug] === 'la-margherita')
    pizzas.rows[line]![price] = '12,50'
    pizzas.rows = pizzas.rows.map(r => [...r].reverse())

    const { result } = fromSheets(sheets)
    if (!result.ok) throw new Error(result.errors.join('\n'))
    const plan = planImport(current, result.backup)
    expect(plan.changes).toEqual([expect.objectContaining({ section: 'pizzas', kind: 'update', label: 'La Margherita', fields: ['Prix (€)'] })])
  })

  it('situe les erreurs par onglet et par ligne', async () => {
    const sheets = asRead(backupToSheets(await exportBackup(await freshDb())))
    const pizzas = sheets.find(s => s.name === 'Pizzas')!
    pizzas.rows[3]![pizzas.rows[0]!.indexOf('Prix (€)')] = 'gratuit'
    sheets.splice(sheets.findIndex(s => s.name === 'Boissons'), 1)

    const { parsed, result } = fromSheets(sheets)
    expect(parsed.errors).toContain('Onglet « Boissons » manquant')
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toContainEqual(expect.stringMatching(/^Onglet « Pizzas », ligne 4 › Prix \(€\) : /))
  })

  it('situe les liens cassés dans l’onglet qui les contient', async () => {
    const sheets = asRead(backupToSheets(await exportBackup(await freshDb())))
    const items = sheets.find(s => s.name === 'Cartes – pizzas')!
    items.rows[2]![items.rows[0]!.indexOf('Pizza')] = 'la-pizza-fantome'

    const { result } = fromSheets(sheets)
    expect(result.ok).toBe(false)
    if (result.ok) return
    expect(result.errors).toContain('Onglet « Cartes – pizzas », ligne 3 › Pizza : pizza « la-pizza-fantome » absente de l\'onglet Pizzas')
  })
})
