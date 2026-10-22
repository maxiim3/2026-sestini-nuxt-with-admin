import {
  BACKUP_FORMAT,
  BACKUP_VERSION,
  type Backup,
  type BackupPath,
  type BackupSection,
  FIELD_LABELS,
  type Locator,
  SECTION_LABELS,
} from '../../shared/backup'
import { TRANSLATED_LOCALES, WEEKDAY_SLUGS, type Weekday } from '../../shared/domain/constants'

/**
 * Conversion sauvegarde ↔ classeur Excel, un onglet par type de données.
 * Les en-têtes sont en français ; l'import retrouve les colonnes par leur
 * en-tête, quel que soit leur ordre.
 */

export type Cell = string | number | boolean | Date | null | undefined
export interface Sheet {
  name: string
  columns: { header: string, width: number, euros?: boolean }[]
  rows: Cell[][]
}

type Kind = 'text' | 'int' | 'number' | 'euros' | 'bool' | 'list' | 'weekday' | 'date' | 'datetime' | 'time' | 'json'
interface Column { key: string, kind: Kind, header?: string, width?: number }
type Rec = Record<string, unknown>

const col = (key: string, kind: Kind = 'text', width?: number): Column => ({ key, kind, width })
const id = col('id', 'text', 12)
const archived = col('archived', 'bool', 9)
/** Colonnes de traduction : « Nom (en) », « Nom (es) »… */
const i18n = (...fields: string[]): Column[] => fields.flatMap(f => TRANSLATED_LOCALES.map(l => ({
  key: `i18n.${l}.${f}`,
  kind: 'text' as const,
  header: `${FIELD_LABELS[f] ?? f} (${l})`,
  width: 20,
})))

/** Onglets d'une ligne par entrée de section */
const SHEETS: Record<BackupSection, Column[]> = {
  locations: [id, col('slug', 'text', 22), col('name', 'text', 24), col('address', 'text', 28), col('city', 'text', 16), col('zip', 'text', 9), col('lat', 'number'), col('lng', 'number'), col('notes', 'text', 24), archived, ...i18n('name', 'notes')],
  seasons: [id, col('slug', 'text', 22), col('name', 'text', 22), col('startsOn', 'date'), col('endsOn', 'date'), col('priority', 'int'), col('isDefault', 'bool'), archived],
  scheduleExceptions: [id, col('kind'), col('startsOn', 'date'), col('endsOn', 'date'), col('location', 'text', 22), col('opensAt', 'time'), col('closesAt', 'time'), col('note', 'text', 28), archived, ...i18n('note')],
  ingredients: [id, col('slug', 'text', 26), col('name', 'text', 28), col('kind'), col('allergens', 'list', 20), col('origin', 'text', 16), archived, ...i18n('name')],
  pizzas: [id, col('slug', 'text', 24), col('name', 'text', 24), col('baseKind'), col('baseLabel', 'text', 24), col('priceCents', 'euros'), col('avant', 'list', 40), col('apres', 'list', 32), col('extraAllergens', 'list', 18), col('imageUrl', 'text', 24), col('imageAlt', 'text', 24), col('notes', 'text', 24), archived, ...i18n('name', 'baseLabel', 'imageAlt')],
  menus: [id, col('slug', 'text', 22), col('name', 'text', 22), col('status'), col('activatesOn', 'date'), col('tagline', 'text', 30), ...i18n('name', 'tagline')],
  featured: [id, col('pizza', 'text', 22), col('title', 'text', 22), col('pitch', 'text', 36), col('startsOn', 'date'), col('endsOn', 'date'), col('showOnHome', 'bool'), col('showOnMenu', 'bool'), col('showInModal', 'bool'), col('priority', 'int'), archived, ...i18n('title', 'pitch')],
  supplements: [id, col('label', 'text', 28), col('priceCents', 'euros'), col('position', 'int'), archived, ...i18n('label')],
  drinks: [id, col('name', 'text', 24), col('volume'), col('category'), col('priceCents', 'euros'), col('position', 'int'), archived, ...i18n('name')],
  desserts: [id, col('name', 'text', 24), col('description', 'text', 36), col('priceCents', 'euros'), col('allergens', 'list', 20), col('position', 'int'), archived, ...i18n('name', 'description')],
  modalMessages: [id, col('kind'), col('title', 'text', 28), col('body', 'text', 48), col('imageUrl', 'text', 20), col('ctas', 'json', 30), col('startsAt', 'datetime', 22), col('endsAt', 'datetime', 22), col('priority', 'int'), col('enabled', 'bool'), archived, ...i18n('title', 'body')],
}

/** Listes imbriquées, chacune dans son onglet, rattachées à leur parent par slug */
const CHILD_SHEETS = {
  slots: { parent: 'seasons', name: 'Créneaux', parentColumn: col('season', 'text', 22), columns: [col('weekday', 'weekday'), col('location', 'text', 22), col('opensAt', 'time'), col('closesAt', 'time')] },
  items: { parent: 'menus', name: 'Cartes – pizzas', parentColumn: col('menu', 'text', 22), columns: [col('section'), col('position', 'int'), col('pizza', 'text', 24)] },
} as const satisfies Record<string, { parent: BackupSection, name: string, parentColumn: Column, columns: Column[] }>

const SETTINGS_SHEET = 'Réglages'
const README_SHEET = 'Lisez-moi'
const SECTION_ORDER: BackupSection[] = ['pizzas', 'ingredients', 'menus', 'featured', 'drinks', 'supplements', 'desserts', 'locations', 'seasons', 'scheduleExceptions', 'modalMessages']

const headerOf = (c: Column) => c.header ?? FIELD_LABELS[c.key] ?? c.key
const WEEKDAY_BY_NAME = new Map(Object.entries(WEEKDAY_SLUGS).map(([n, name]) => [name, Number(n) as Weekday]))

// ─── Écriture ─────────────────────────────────────────────────────────────

function getPath(row: Rec, key: string): unknown {
  return key.split('.').reduce<unknown>((v, k) => (v as Rec | null | undefined)?.[k], row)
}

function toCell(value: unknown, kind: Kind): Cell {
  if (value === null || value === undefined) return null
  switch (kind) {
    case 'euros': return (value as number) / 100
    case 'bool': return value ? 'oui' : 'non'
    case 'list': return (value as string[]).join(', ')
    case 'weekday': return WEEKDAY_SLUGS[value as Weekday]
    case 'json': return (value as unknown[]).length ? JSON.stringify(value) : null
    default: return value as Cell
  }
}

function sheetOf(name: string, columns: Column[], rows: Rec[]): Sheet {
  return {
    name,
    columns: columns.map(c => ({ header: headerOf(c), width: c.width ?? 12, euros: c.kind === 'euros' })),
    rows: rows.map(r => columns.map(c => toCell(getPath(r, c.key), c.kind))),
  }
}

const README = [
  'Sauvegarde du contenu du site Sestini Pizza, un onglet par type de données.',
  'Pour modifier le site : changez les cellules, enregistrez, puis importez le fichier dans l\'atelier (page Sauvegarde). Un récapitulatif s\'affiche avant toute écriture.',
  'Ne modifiez pas la colonne « Id » : elle relie chaque ligne à la base. Pour ajouter une ligne, laissez « Id » vide.',
  'Une ligne supprimée du fichier est archivée sur le site (supprimée pour les pizzas du moment, exceptions et messages). Pour masquer sans supprimer, mettez « oui » dans « Archivé ».',
  'Les liens entre onglets passent par le slug : ingrédients d\'une pizza (séparés par des virgules), pizzas d\'une carte, lieu d\'un créneau ou d\'une exception.',
  'Prix en euros, dates au format AAAA-MM-JJ, heures au format HH:MM, cases oui / non.',
]

export function backupToSheets(backup: Backup): Sheet[] {
  const settings: Cell[][] = []
  for (const [key, value] of Object.entries(backup.settings)) {
    const flat = value && typeof value === 'object' && !Array.isArray(value)
      && Object.values(value).every(v => v === null || typeof v !== 'object')
    if (flat) for (const [field, v] of Object.entries(value as Rec)) settings.push([key, field, v as Cell])
    else settings.push([key, null, JSON.stringify(value)])
  }

  return [
    { name: README_SHEET, columns: [{ header: `Exporté le ${backup.exportedAt ?? ''}`, width: 120 }], rows: README.map(line => [line]) },
    ...SECTION_ORDER.flatMap((section) => {
      const own = sheetOf(SECTION_LABELS[section], SHEETS[section], backup[section] as Rec[])
      const children = Object.entries(CHILD_SHEETS).filter(([, child]) => child.parent === section).map(([field, child]) =>
        sheetOf(child.name, [child.parentColumn, ...child.columns], (backup[section] as Rec[]).flatMap(parent =>
          (parent[field] as Rec[]).map(item => ({ ...item, [child.parentColumn.key]: parent.slug })))))
      return [own, ...children]
    }),
    { name: SETTINGS_SHEET, columns: [{ header: 'Réglage', width: 18 }, { header: 'Champ', width: 16 }, { header: 'Valeur', width: 60 }], rows: settings },
  ]
}

// ─── Lecture ──────────────────────────────────────────────────────────────

/** Nombre décimal saisi à la française (« 11,50 ») ou valeur Excel */
function toNumber(value: Cell) {
  if (typeof value === 'number') return value
  const n = Number(String(value).replace(/\s/g, '').replace(',', '.'))
  return Number.isFinite(n) ? n : value
}

const pad = (n: number) => String(n).padStart(2, '0')

function fromCell(value: Cell, kind: Kind): unknown {
  if (value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
    return kind === 'list' ? [] : kind === 'json' ? [] : undefined
  }
  const text = typeof value === 'string' ? value.trim() : value
  switch (kind) {
    case 'text': return value instanceof Date ? value.toISOString().slice(0, 10) : String(text)
    case 'int':
    case 'number': return toNumber(text)
    case 'euros': {
      const n = toNumber(text)
      return typeof n === 'number' ? Math.round(n * 100) : n
    }
    case 'bool': {
      const v = String(text).toLowerCase()
      if (['oui', 'vrai', 'true', '1', 'x'].includes(v)) return true
      if (['non', 'faux', 'false', '0'].includes(v)) return false
      return text
    }
    case 'list': return String(text).split(/[,;\n]/).map(t => t.trim()).filter(Boolean)
    case 'weekday': return WEEKDAY_BY_NAME.get(String(text).toLowerCase()) ?? toNumber(text)
    case 'date': return value instanceof Date ? value.toISOString().slice(0, 10) : String(text)
    case 'datetime': return value instanceof Date ? value.toISOString() : String(text)
    case 'time': {
      // Excel peut transformer « 18:00 » en heure (fraction de jour ou date)
      if (value instanceof Date) return `${pad(value.getUTCHours())}:${pad(value.getUTCMinutes())}`
      if (typeof value === 'number' && value < 1) {
        const minutes = Math.round(value * 24 * 60)
        return `${pad(Math.floor(minutes / 60))}:${pad(minutes % 60)}`
      }
      return String(text)
    }
    case 'json': {
      try {
        return JSON.parse(String(text))
      }
      catch {
        return text
      }
    }
  }
}

function setPath(row: Rec, key: string, value: unknown) {
  const keys = key.split('.')
  let target = row
  for (const k of keys.slice(0, -1)) target = (target[k] ??= {}) as Rec
  target[keys.at(-1)!] = value
}

export interface ParsedWorkbook {
  raw: unknown
  locate: Locator
  errors: string[]
}

/** Lit les onglets d'un classeur et reconstruit une sauvegarde (à valider ensuite) */
export function sheetsToBackup(sheets: { name: string, rows: Cell[][] }[]): ParsedWorkbook {
  const errors: string[] = []
  const origins = new Map<string, string>()
  const byName = new Map(sheets.map(sh => [sh.name.trim().toLowerCase(), sh]))
  const where = (sheet: string, line: number) => `Onglet « ${sheet} », ligne ${line}`

  /** Lignes non vides d'un onglet, avec leur numéro de ligne Excel */
  function read(name: string, columns: Column[]) {
    const sheet = byName.get(name.toLowerCase())
    if (!sheet) {
      errors.push(`Onglet « ${name} » manquant`)
      return []
    }
    const [header = [], ...lines] = sheet.rows
    const index = new Map(header.map((h, i) => [String(h ?? '').trim().toLowerCase(), i]))
    const missing = columns.filter(c => !c.key.startsWith('i18n.') && !index.has(headerOf(c).toLowerCase()))
    if (missing.length) errors.push(`Onglet « ${name} » : colonne${missing.length > 1 ? 's' : ''} ${missing.map(c => `« ${headerOf(c)} »`).join(', ')} introuvable${missing.length > 1 ? 's' : ''}`)
    return lines
      .map((cells, i) => ({ cells, line: i + 2 }))
      .filter(({ cells }) => cells.some(c => c !== null && c !== undefined && String(c).trim() !== ''))
      .map(({ cells, line }) => {
        const row: Rec = {}
        for (const c of columns) {
          const at = index.get(headerOf(c).toLowerCase())
          const value = fromCell(at === undefined ? undefined : cells[at], c.kind)
          if (value !== undefined) setPath(row, c.key, value)
        }
        return { row, line }
      })
  }

  const raw: Rec = { format: BACKUP_FORMAT, version: BACKUP_VERSION }
  for (const section of SECTION_ORDER) {
    const label = SECTION_LABELS[section]
    raw[section] = read(label, SHEETS[section]).map(({ row, line }, i) => {
      origins.set(`${section}.${i}`, where(label, line))
      return row
    })
  }
  for (const [field, child] of Object.entries(CHILD_SHEETS)) {
    const parents = raw[child.parent] as Rec[]
    parents.forEach(p => p[field] = [])
    for (const { row, line } of read(child.name, [child.parentColumn, ...child.columns])) {
      const { [child.parentColumn.key]: parentSlug, ...item } = row
      const i = parents.findIndex(p => p.slug === parentSlug)
      if (i < 0) {
        errors.push(`${where(child.name, line)} : ${headerOf(child.parentColumn)} « ${parentSlug ?? ''} » absente de l'onglet ${SECTION_LABELS[child.parent]}`)
        continue
      }
      const list = parents[i]![field] as Rec[]
      origins.set(`${child.parent}.${i}.${field}.${list.length}`, where(child.name, line))
      list.push(item)
    }
  }

  const settings: Rec = {}
  const settingsSheet = byName.get(SETTINGS_SHEET.toLowerCase())
  if (!settingsSheet) errors.push(`Onglet « ${SETTINGS_SHEET} » manquant`)
  settingsSheet?.rows.slice(1).forEach(([key, field, value], i) => {
    if (!key) return
    if (field) {
      const target = (settings[String(key)] ??= {}) as Rec
      target[String(field)] = value instanceof Date ? value.toISOString() : (value ?? null)
      return
    }
    try {
      settings[String(key)] = JSON.parse(String(value))
    }
    catch {
      errors.push(`${where(SETTINGS_SHEET, i + 2)} : valeur illisible pour « ${key} »`)
    }
  })
  raw.settings = settings

  const locate: Locator = (path: BackupPath) => {
    for (let n = path.length; n > 0; n--) {
      const origin = origins.get(path.slice(0, n).join('.'))
      if (origin) return origin
    }
    return SECTION_LABELS[path[0] as BackupSection] ?? String(path[0])
  }
  return { raw, locate, errors }
}
