import { createHash } from 'node:crypto'
import { asc } from 'drizzle-orm'
import {
  BACKUP_FORMAT,
  BACKUP_ROW_SCHEMAS,
  BACKUP_VERSION,
  type Backup,
  type BackupChange,
  type BackupSection,
  type BackupValidation,
  FIELD_LABELS,
  SECTION_LABELS,
  validateBackup,
} from '../../shared/backup'
import type { MenuSection } from '../../shared/domain/constants'
import type { EntityName, Operation } from '../../shared/schemas'
import * as s from '../database/schema'
import type { Database } from '../utils/db'
import { readWorkbook } from '../utils/xlsx'
import { sheetsToBackup } from './backup-sheets'
import { loadSettings } from './catalog'
import { type Actor, commitOperations } from './operations'

type Rec = Record<string, unknown>
type LinkSection = 'locations' | 'ingredients' | 'pizzas'
type ScheduleSlot = Extract<Operation, { op: 'setScheduleSlots' }>['slots'][number]

/** Comment chaque section se traduit en opérations d'écriture */
interface SectionConfig {
  entity: EntityName
  /** Ce que devient une ligne absente du fichier */
  removal: 'archive' | 'delete' | 'menuStatus'
  /** Champ « slug » du fichier → champ « id » de l'opération */
  links?: Record<string, { field: string, section: LinkSection }>
  /** Champs gérés par des opérations dédiées (ingrédients d'une pizza, créneaux…) */
  nested?: string[]
}

/** Ordre d'écriture : les lignes référencées passent avant celles qui les citent */
const SECTIONS: Record<BackupSection, SectionConfig> = {
  ingredients: { entity: 'ingredient', removal: 'archive' },
  locations: { entity: 'location', removal: 'archive' },
  seasons: { entity: 'season', removal: 'archive', nested: ['slots'] },
  pizzas: { entity: 'pizza', removal: 'archive', nested: ['avant', 'apres'] },
  menus: { entity: 'menu', removal: 'menuStatus', nested: ['items'] },
  featured: { entity: 'featured', removal: 'delete', links: { pizza: { field: 'pizzaId', section: 'pizzas' } } },
  supplements: { entity: 'supplement', removal: 'archive' },
  drinks: { entity: 'drink', removal: 'archive' },
  desserts: { entity: 'dessert', removal: 'archive' },
  scheduleExceptions: { entity: 'scheduleException', removal: 'delete', links: { location: { field: 'locationId', section: 'locations' } } },
  modalMessages: { entity: 'modalMessage', removal: 'delete' },
}
const ORDER = Object.keys(SECTIONS) as BackupSection[]

/** Champs de contenu d'une section (hors id, archivage, liens et listes imbriquées) */
function dataFields(section: BackupSection) {
  const { links = {}, nested = [] } = SECTIONS[section]
  return Object.keys(BACKUP_ROW_SCHEMAS[section].shape)
    .filter(k => k !== 'id' && k !== 'archived' && !(k in links) && !nested.includes(k))
}

function pick(row: Rec, keys: string[]) {
  return Object.fromEntries(keys.map(k => [k, row[k] ?? null]))
}

// ─── Export ───────────────────────────────────────────────────────────────

/** Toutes les données de contenu, archives comprises. Jamais les comptes, jetons ni journaux. */
export async function exportBackup(db: Database, now = new Date()): Promise<Backup> {
  const [settings, locations, seasons, slots, exceptions, ingredients, pizzas, pizzaIngredients, menus, menuItems, featured, supplements, drinks, desserts, messages] = await Promise.all([
    loadSettings(db),
    db.select().from(s.locations).orderBy(asc(s.locations.slug)),
    db.select().from(s.seasons).orderBy(asc(s.seasons.slug)),
    db.select().from(s.scheduleSlots).orderBy(asc(s.scheduleSlots.weekday)),
    db.select().from(s.scheduleExceptions).orderBy(asc(s.scheduleExceptions.startsOn)),
    db.select().from(s.ingredients).orderBy(asc(s.ingredients.slug)),
    db.select().from(s.pizzas).orderBy(asc(s.pizzas.slug)),
    db.select().from(s.pizzaIngredients).orderBy(asc(s.pizzaIngredients.position)),
    db.select().from(s.menus).orderBy(asc(s.menus.slug)),
    db.select().from(s.menuItems).orderBy(asc(s.menuItems.section), asc(s.menuItems.position)),
    db.select().from(s.featuredPizzas).orderBy(asc(s.featuredPizzas.startsOn)),
    db.select().from(s.supplements).orderBy(asc(s.supplements.position)),
    db.select().from(s.drinks).orderBy(asc(s.drinks.position)),
    db.select().from(s.desserts).orderBy(asc(s.desserts.position)),
    db.select().from(s.modalMessages).orderBy(asc(s.modalMessages.startsAt)),
  ])
  const slugById = (rows: { id: string, slug: string }[]) => new Map(rows.map(r => [r.id, r.slug]))
  const locationSlug = slugById(locations)
  const ingredientSlug = slugById(ingredients)
  const pizzaSlug = slugById(pizzas)

  const rows = <K extends BackupSection>(section: K, list: Rec[], extra: (r: Rec) => Rec = () => ({})) =>
    list.map(r => ({
      id: r.id,
      ...pick(r, dataFields(section)),
      ...(section === 'menus' ? {} : { archived: r.archivedAt != null }),
      ...extra(r),
    })) as unknown as Backup[K]

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    settings,
    locations: rows('locations', locations),
    seasons: rows('seasons', seasons, se => ({
      slots: slots.filter(sl => sl.seasonId === se.id)
        .map(sl => ({ weekday: sl.weekday, location: locationSlug.get(sl.locationId)!, opensAt: sl.opensAt, closesAt: sl.closesAt })),
    })),
    scheduleExceptions: rows('scheduleExceptions', exceptions, e => ({ location: e.locationId ? locationSlug.get(e.locationId as string)! : null })),
    ingredients: rows('ingredients', ingredients),
    pizzas: rows('pizzas', pizzas, (p) => {
      const own = pizzaIngredients.filter(pi => pi.pizzaId === p.id)
      const stage = (st: 'avant' | 'apres') => own.filter(pi => pi.stage === st).map(pi => ingredientSlug.get(pi.ingredientId)!)
      return { avant: stage('avant'), apres: stage('apres') }
    }),
    menus: rows('menus', menus, m => ({
      items: menuItems.filter(i => i.menuId === m.id).map(i => ({ pizza: pizzaSlug.get(i.pizzaId)!, section: i.section, position: i.position })),
    })),
    featured: rows('featured', featured, f => ({ pizza: pizzaSlug.get(f.pizzaId as string)! })),
    supplements: rows('supplements', supplements),
    drinks: rows('drinks', drinks),
    desserts: rows('desserts', desserts),
    modalMessages: rows('modalMessages', messages),
  }
}

// ─── Comparaison et plan d'import ────────────────────────────────────────

/** Traductions sans champs vides ; null si rien */
function cleanI18n(value: unknown) {
  if (!value || typeof value !== 'object') return null
  const out: Record<string, Record<string, string>> = {}
  for (const [locale, fields] of Object.entries(value as Rec)) {
    const kept = Object.entries((fields ?? {}) as Rec).filter(([, v]) => typeof v === 'string' && v.trim() !== '')
    if (kept.length) out[locale] = Object.fromEntries(kept) as Record<string, string>
  }
  return Object.keys(out).length ? out : null
}

/** JSON à clés triées, pour comparer des valeurs sans dépendre de l'ordre des clés */
function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(stable).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.entries(value).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${stable(v)}`).join(',')}}`
  }
  return JSON.stringify(value ?? null)
}

/** Absent, null et chaîne vide se valent, à toute profondeur (une cellule Excel vide ne distingue pas les trois) */
function blank(value: unknown): unknown {
  if (value === undefined || value === '') return null
  if (Array.isArray(value)) return value.map(blank)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, blank(v)]).filter(([, v]) => v !== null))
  }
  return value
}

/** Égalité tolérante aux valeurs vides ; traductions vides ignorées */
function same(field: string, a: unknown, b: unknown) {
  const norm = (v: unknown) => field === 'i18n' ? cleanI18n(v) : blank(v)
  return stable(norm(a)) === stable(norm(b))
}

function labelOf(section: BackupSection, row: Rec) {
  const name = row.name ?? row.label ?? row.title ?? row.note ?? row.slug
  if (section === 'featured') return `${row.title} (${row.pizza})`
  if (section === 'scheduleExceptions') return `${name ?? row.kind} du ${row.startsOn} au ${row.endsOn}`
  return String(name ?? row.id)
}

export interface ImportPlan {
  operations: Operation[]
  changes: BackupChange[]
  warnings: string[]
}

/**
 * Compare la base actuelle (sous forme de sauvegarde) au fichier importé et
 * calcule les opérations à appliquer. Fonction pure : rien n'est écrit.
 */
export function planImport(current: Backup, incoming: Backup): ImportPlan {
  const operations: Operation[] = []
  const changes: BackupChange[] = []
  const warnings: string[] = []
  const tail: Operation[] = []

  // Appariement fichier ↔ base : par id, sinon par slug, sinon (ligne ajoutée à la main) par contenu identique
  const matches = new Map<BackupSection, Map<Rec, Rec | undefined>>()
  for (const section of ORDER) {
    const rows = current[section] as Rec[]
    const byId = new Map(rows.map(r => [r.id, r]))
    const bySlug = new Map(rows.filter(r => r.slug).map(r => [r.slug, r]))
    const compared = [...dataFields(section), ...Object.keys(SECTIONS[section].links ?? {})]
    const taken = new Set<Rec>()
    const map = new Map<Rec, Rec | undefined>()
    const incomingRows = incoming[section] as Rec[]
    for (const row of incomingRows) {
      const found = (row.id ? byId.get(row.id) : undefined) ?? (row.slug ? bySlug.get(row.slug) : undefined)
      map.set(row, found && !taken.has(found) ? found : undefined)
      if (found) taken.add(found)
    }
    for (const row of incomingRows.filter(r => !r.id && !r.slug)) {
      const twin = rows.find(r => !taken.has(r) && compared.every(f => same(f, row[f], r[f])))
      if (twin) {
        map.set(row, twin)
        taken.add(twin)
      }
    }
    matches.set(section, map)
  }

  /** Clé d'opération d'une ligne : id existant, ou alias « $section:slug » pour une ligne créée */
  const keyOf = (section: BackupSection, row: Rec) => {
    const match = matches.get(section)!.get(row)
    return match ? String(match.id) : `$${section}:${row.slug ?? row.id ?? (incoming[section] as Rec[]).indexOf(row)}`
  }
  const incomingLink = (section: LinkSection, slug: string) => keyOf(section, (incoming[section] as Rec[]).find(r => r.slug === slug)!)
  const currentLink = (section: LinkSection, slug: string) => String((current[section] as Rec[]).find(r => r.slug === slug)?.id)
  const linkList = (section: LinkSection, slugs: string[], side: 'incoming' | 'current') =>
    slugs.map(slug => side === 'incoming' ? incomingLink(section, slug) : currentLink(section, slug))

  for (const section of ORDER) {
    const { entity, removal, links = {} } = SECTIONS[section]
    const fields = dataFields(section)
    const map = matches.get(section)!

    for (const [row, match] of map) {
      const label = labelOf(section, row)
      const data: Rec = pick(row, fields)
      for (const [from, { field, section: target }] of Object.entries(links)) {
        data[field] = row[from] ? incomingLink(target, String(row[from])) : null
      }

      const id = keyOf(section, row)
      const changed: string[] = []
      if (!match) {
        operations.push({ op: 'create', entity, ref: id, data })
        if (row.archived) operations.push({ op: 'archive', entity, id })
        changes.push({ section, kind: 'create', label })
      }
      else {
        changed.push(...fields.filter(f => !same(f, row[f], match[f])))
        for (const [from, { section: target }] of Object.entries(links)) {
          const before = match[from] ? currentLink(target, String(match[from])) : null
          const after = row[from] ? incomingLink(target, String(row[from])) : null
          if (before !== after) changed.push(from)
        }
        // Données complètes : une mise à jour partielle remettrait les autres champs à leur valeur par défaut
        if (changed.length) operations.push({ op: 'update', entity, id, data })
        if (section !== 'menus' && Boolean(row.archived) !== Boolean(match.archived)) {
          operations.push({ op: row.archived ? 'archive' : 'restore', entity, id })
          changes.push({ section, kind: row.archived ? 'archive' : 'restore', label })
        }
      }

      if (section === 'pizzas') {
        const after = { avant: linkList('ingredients', row.avant as string[], 'incoming'), apres: linkList('ingredients', row.apres as string[], 'incoming') }
        const before = match && { avant: linkList('ingredients', match.avant as string[], 'current'), apres: linkList('ingredients', match.apres as string[], 'current') }
        if (stable(before ?? { avant: [], apres: [] }) !== stable(after)) {
          operations.push({ op: 'setPizzaIngredients', pizzaId: id, ...after })
          changed.push('ingredients')
        }
      }
      if (section === 'menus') {
        const itemsOf = (list: Rec[], side: 'incoming' | 'current') => list
          .map(i => ({ pizzaId: linkList('pizzas', [String(i.pizza)], side)[0]!, section: i.section as MenuSection, position: Number(i.position) }))
          .sort((a, b) => a.pizzaId.localeCompare(b.pizzaId))
        const items = itemsOf(row.items as Rec[], 'incoming')
        if (stable(match ? itemsOf(match.items as Rec[], 'current') : []) !== stable(items)) {
          operations.push({ op: 'setMenuItems', menuId: id, items })
          changed.push('items')
        }
      }
      if (section === 'seasons') {
        const slotsOf = (list: Rec[], side: 'incoming' | 'current') => list
          .map(({ location, ...sl }) => ({ ...sl, locationId: linkList('locations', [String(location)], side)[0]! }) as ScheduleSlot)
          .sort((a, b) => a.weekday - b.weekday)
        const slots = slotsOf(row.slots as Rec[], 'incoming')
        // Les créneaux citent des lieux : on les écrit une fois tous les lieux créés
        if (stable(match ? slotsOf(match.slots as Rec[], 'current') : []) !== stable(slots)) {
          tail.push({ op: 'setScheduleSlots', seasonId: id, slots })
          changed.push('slots')
        }
      }
      if (match && changed.length) changes.push({ section, kind: 'update', label, fields: changed.map(f => FIELD_LABELS[f] ?? f) })
    }

    // Lignes de la base absentes du fichier
    const kept = new Set(map.values())
    for (const old of current[section] as Rec[]) {
      if (kept.has(old)) continue
      const label = labelOf(section, old)
      if (removal === 'delete') {
        tail.push({ op: 'delete', entity: entity as 'featured' | 'scheduleException' | 'modalMessage', id: String(old.id) })
        changes.push({ section, kind: 'delete', label })
      }
      else if (removal === 'menuStatus') {
        if (old.status === 'archived') continue
        const data = { ...pick(old, fields), status: 'archived' }
        tail.push({ op: 'update', entity, id: String(old.id), data })
        changes.push({ section, kind: 'archive', label })
      }
      else if (!old.archived) {
        tail.push({ op: 'archive', entity, id: String(old.id) })
        changes.push({ section, kind: 'archive', label })
      }
    }
  }

  for (const [key, value] of Object.entries(incoming.settings)) {
    const exists = key in current.settings
    if (exists && same('value', value, current.settings[key])) continue
    operations.push({ op: 'setSetting', key, value })
    changes.push({ section: 'settings', kind: exists ? 'update' : 'create', label: key })
  }
  for (const key of Object.keys(current.settings).filter(k => !(k in incoming.settings))) {
    warnings.push(`Le réglage « ${key} » est absent du fichier : il est conservé tel quel.`)
  }

  return { operations: [...operations, ...tail], changes, warnings }
}

/** Empreinte d'un plan : l'import confirmé doit correspondre à l'aperçu affiché */
export function planFingerprint(plan: ImportPlan) {
  return createHash('sha256').update(stable(plan.operations)).digest('hex').slice(0, 16)
}

export function summarize(plan: ImportPlan) {
  const sections = Object.entries(SECTION_LABELS)
    .map(([section, label]) => ({ section, label, changes: plan.changes.filter(c => c.section === section) }))
    .filter(g => g.changes.length)
  return { sections, total: plan.changes.length, warnings: plan.warnings, fingerprint: planFingerprint(plan) }
}

/** Applique un import comme une publication de l'atelier : une transaction, une révision par changement */
export async function applyImport(db: Database, plan: ImportPlan, title: string, actor: Actor) {
  if (!plan.operations.length) return { changesetId: null, revisions: 0 }
  const { changesetId, revisions } = await commitOperations(db, title, plan.operations, actor)
  return { changesetId, revisions }
}

// ─── Fichiers ─────────────────────────────────────────────────────────────

export const BACKUP_MAX_BYTES = 5 * 1024 * 1024

/** Lit un fichier déposé (JSON ou Excel) et le valide, sans rien écrire */
export async function readBackupFile(data: Buffer): Promise<BackupValidation> {
  if (data.length > BACKUP_MAX_BYTES) return { ok: false, errors: ['Fichier trop lourd (5 Mo maximum)'] }
  // Un .xlsx est une archive zip : signature « PK »
  if (data[0] === 0x50 && data[1] === 0x4B) {
    let sheets
    try {
      sheets = await readWorkbook(data)
    }
    catch {
      return { ok: false, errors: ['Fichier Excel illisible. Enregistrez-le au format .xlsx puis réessayez.'] }
    }
    const parsed = sheetsToBackup(sheets)
    const result = validateBackup(parsed.raw, parsed.locate)
    return parsed.errors.length ? { ok: false, errors: [...parsed.errors, ...(result.ok ? [] : result.errors)] } : result
  }
  let raw: unknown
  try {
    raw = JSON.parse(data.toString('utf8'))
  }
  catch {
    return { ok: false, errors: ['Fichier illisible : seuls les fichiers .json et .xlsx exportés depuis l\'atelier sont acceptés.'] }
  }
  return validateBackup(raw)
}
