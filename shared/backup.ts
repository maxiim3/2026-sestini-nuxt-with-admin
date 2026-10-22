import { z } from 'zod'
import {
  dessertInput,
  drinkInput,
  featuredInput,
  ingredientInput,
  locationInput,
  menuInput,
  menuItemInput,
  modalMessageInput,
  pizzaInput,
  scheduleExceptionBase,
  scheduleSlotInput,
  seasonInput,
  supplementInput,
} from './schemas'

/**
 * Sauvegarde complète du contenu du site (JSON ou Excel).
 * Les lignes gardent leur id ; les liens entre données passent par les slugs
 * (lisibles dans un tableur). Comptes, jetons, liens de connexion et journal
 * ne sont jamais exportés.
 */
export const BACKUP_FORMAT = 'sestini-sauvegarde'
export const BACKUP_VERSION = 1

const slugRef = z.string().min(1)
const row = {
  id: z.string().min(1).optional(),
  archived: z.boolean().default(false),
}

export const backupSlotSchema = scheduleSlotInput.omit({ locationId: true }).extend({ location: slugRef })
export const backupMenuItemSchema = menuItemInput.omit({ pizzaId: true }).extend({ pizza: slugRef })

export const BACKUP_ROW_SCHEMAS = {
  locations: locationInput.extend(row),
  seasons: seasonInput.extend({ ...row, slots: z.array(backupSlotSchema).default([]) }),
  scheduleExceptions: scheduleExceptionBase.omit({ locationId: true }).extend({ ...row, location: slugRef.nullable().optional() })
    .refine(e => e.startsOn <= e.endsOn, { message: 'La date de fin précède la date de début', path: ['endsOn'] }),
  ingredients: ingredientInput.extend(row),
  pizzas: pizzaInput.extend({ ...row, avant: z.array(slugRef).default([]), apres: z.array(slugRef).default([]) }),
  menus: menuInput.extend({ id: row.id, items: z.array(backupMenuItemSchema).default([]) }),
  featured: featuredInput.omit({ pizzaId: true }).extend({ ...row, pizza: slugRef }),
  supplements: supplementInput.extend(row),
  drinks: drinkInput.extend(row),
  desserts: dessertInput.extend(row),
  modalMessages: modalMessageInput.extend(row),
} as const

export type BackupSection = keyof typeof BACKUP_ROW_SCHEMAS
export const BACKUP_SECTIONS = Object.keys(BACKUP_ROW_SCHEMAS) as BackupSection[]

export const SECTION_LABELS: Record<BackupSection | 'settings', string> = {
  settings: 'Réglages',
  locations: 'Lieux',
  seasons: 'Saisons',
  scheduleExceptions: 'Exceptions',
  ingredients: 'Ingrédients',
  pizzas: 'Pizzas',
  menus: 'Cartes',
  featured: 'Pizzas du moment',
  supplements: 'Suppléments',
  drinks: 'Boissons',
  desserts: 'Desserts',
  modalMessages: 'Messages du bandeau',
}

/** Libellés français des champs : en-têtes Excel et messages d'erreur */
export const FIELD_LABELS: Record<string, string> = {
  id: 'Id',
  archived: 'Archivé',
  slug: 'Slug',
  name: 'Nom',
  label: 'Libellé',
  title: 'Titre',
  address: 'Adresse',
  city: 'Ville',
  zip: 'Code postal',
  lat: 'Latitude',
  lng: 'Longitude',
  notes: 'Notes',
  startsOn: 'Début',
  endsOn: 'Fin',
  startsAt: 'Début',
  endsAt: 'Fin',
  priority: 'Priorité',
  isDefault: 'Par défaut',
  weekday: 'Jour',
  location: 'Lieu',
  opensAt: 'Ouverture',
  closesAt: 'Fermeture',
  kind: 'Type',
  note: 'Note publique',
  allergens: 'Allergènes',
  extraAllergens: 'Allergènes en plus',
  origin: 'Origine',
  baseKind: 'Type de base',
  baseLabel: 'Base',
  priceCents: 'Prix (€)',
  imageUrl: 'Image',
  imageAlt: 'Texte alternatif',
  avant: 'Avant cuisson',
  apres: 'Après cuisson',
  status: 'Statut',
  activatesOn: 'Activation',
  tagline: 'Accroche',
  items: 'Pizzas',
  menu: 'Carte',
  pizza: 'Pizza',
  section: 'Section',
  position: 'Position',
  pitch: 'Texte',
  showOnHome: 'Sur l\'accueil',
  showOnMenu: 'Sur la carte',
  showInModal: 'Dans le bandeau',
  volume: 'Volume',
  category: 'Catégorie',
  description: 'Description',
  body: 'Texte',
  ctas: 'Boutons',
  enabled: 'Actif',
  i18n: 'Traductions',
  season: 'Saison',
  slots: 'Créneaux',
  ingredients: 'Ingrédients',
  key: 'Clé',
  value: 'Valeur',
}

const shape = Object.fromEntries(BACKUP_SECTIONS.map(section => [section, z.array(BACKUP_ROW_SCHEMAS[section])])) as {
  [K in BackupSection]: z.ZodArray<(typeof BACKUP_ROW_SCHEMAS)[K]>
}

const backupObject = z.object({
  format: z.literal(BACKUP_FORMAT, { error: 'Ce fichier n\'est pas une sauvegarde du site Sestini' }),
  version: z.literal(BACKUP_VERSION, { error: `Version de sauvegarde non prise en charge (attendue : ${BACKUP_VERSION})` }),
  exportedAt: z.string().optional(),
  settings: z.record(z.string(), z.unknown()),
  ...shape,
})

export type Backup = z.output<typeof backupObject>
export type BackupRow<K extends BackupSection> = Backup[K][number]

export const backupSchema = backupObject.superRefine(checkReferences)

/** Unicité des ids et des slugs, et liens vers des lignes présentes dans le fichier */
function checkReferences(b: Backup, ctx: z.RefinementCtx) {
  const issue = (path: (string | number)[], message: string) => ctx.addIssue({ code: 'custom', path, message })

  for (const section of BACKUP_SECTIONS) {
    const ids = new Set<string>()
    const slugs = new Set<string>()
    b[section].forEach((r, i) => {
      if (r.id) {
        if (ids.has(r.id)) issue([section, i, 'id'], `id « ${r.id} » en double`)
        ids.add(r.id)
      }
      if ('slug' in r) {
        if (slugs.has(r.slug)) issue([section, i, 'slug'], `slug « ${r.slug} » en double`)
        slugs.add(r.slug)
      }
    })
  }

  const slugsOf = (section: 'locations' | 'ingredients' | 'pizzas') => new Set(b[section].map(r => r.slug))
  const locations = slugsOf('locations')
  const ingredients = slugsOf('ingredients')
  const pizzas = slugsOf('pizzas')

  b.pizzas.forEach((p, i) => {
    for (const stage of ['avant', 'apres'] as const) {
      p[stage].forEach((slug, j) => {
        if (!ingredients.has(slug)) issue(['pizzas', i, stage, j], `ingrédient « ${slug} » absent de l'onglet Ingrédients`)
      })
    }
  })
  b.menus.forEach((m, i) => {
    const seen = new Set<string>()
    m.items.forEach((item, j) => {
      if (!pizzas.has(item.pizza)) issue(['menus', i, 'items', j, 'pizza'], `pizza « ${item.pizza} » absente de l'onglet Pizzas`)
      if (seen.has(item.pizza)) issue(['menus', i, 'items', j, 'pizza'], `pizza « ${item.pizza} » présente deux fois sur la carte « ${m.slug} »`)
      seen.add(item.pizza)
    })
  })
  b.featured.forEach((f, i) => {
    if (!pizzas.has(f.pizza)) issue(['featured', i, 'pizza'], `pizza « ${f.pizza} » absente de l'onglet Pizzas`)
  })
  b.seasons.forEach((season, i) => {
    const days = new Set<number>()
    season.slots.forEach((slot, j) => {
      if (!locations.has(slot.location)) issue(['seasons', i, 'slots', j, 'location'], `lieu « ${slot.location} » absent de l'onglet Lieux`)
      if (days.has(slot.weekday)) issue(['seasons', i, 'slots', j, 'weekday'], `jour ${slot.weekday} présent deux fois pour la saison « ${season.slug} »`)
      days.add(slot.weekday)
    })
  })
  b.scheduleExceptions.forEach((e, i) => {
    if (e.location && !locations.has(e.location)) issue(['scheduleExceptions', i, 'location'], `lieu « ${e.location} » absent de l'onglet Lieux`)
  })
}

export type BackupPath = readonly PropertyKey[]

/** Situe une erreur pour un humain : « Pizzas › la-reine » ou « Onglet Pizzas, ligne 4 » */
export type Locator = (path: BackupPath) => string

/** Repère par défaut (JSON) : section, puis slug, nom ou numéro de la ligne */
export function jsonLocator(raw: unknown): Locator {
  return (path) => {
    const [section, index, ...rest] = path
    const parts: string[] = []
    if (typeof section === 'string') parts.push(SECTION_LABELS[section as BackupSection] ?? section)
    if (typeof index === 'number') {
      const r = (raw as Record<string, unknown[] | undefined>)?.[section as string]?.[index] as Record<string, unknown> | undefined
      const name = r?.slug ?? r?.name ?? r?.label ?? r?.title
      parts.push(typeof name === 'string' ? `« ${name} »` : `ligne ${index + 1}`)
    }
    else if (typeof index === 'string') parts.push(index)
    const nested = rest.findIndex(p => typeof p === 'number')
    if (nested > 0) parts.push(`${FIELD_LABELS[String(rest[nested - 1])] ?? String(rest[nested - 1])} n° ${(rest[nested] as number) + 1}`)
    return parts.join(' › ')
  }
}

function fieldOf(path: BackupPath) {
  const last = [...path].reverse().find(p => typeof p === 'string' && p in FIELD_LABELS)
  return last && path.length > 2 ? FIELD_LABELS[last as string] : null
}

export type BackupValidation = { ok: true, backup: Backup } | { ok: false, errors: string[] }

const MAX_ERRORS = 30

/** Valide un fichier déjà lu (objet JS) et renvoie des erreurs en français */
export function validateBackup(raw: unknown, locate: Locator = jsonLocator(raw)): BackupValidation {
  // Pas une sauvegarde du tout : inutile de lister chaque section manquante
  if ((raw as { format?: unknown } | null)?.format !== BACKUP_FORMAT) return { ok: false, errors: ['Ce fichier n\'est pas une sauvegarde du site Sestini'] }
  const parsed = backupSchema.safeParse(raw, { error: z.locales.fr().localeError })
  if (parsed.success) return { ok: true, backup: parsed.data }
  const errors = parsed.error.issues.slice(0, MAX_ERRORS).map((issue) => {
    if (!issue.path.length) return issue.message
    if (issue.path.length === 1 && issue.code === 'invalid_type' && issue.input === undefined) {
      return `Section « ${SECTION_LABELS[issue.path[0] as BackupSection] ?? String(issue.path[0])} » manquante`
    }
    const field = fieldOf(issue.path)
    return `${locate(issue.path)}${field ? ` › ${field}` : ''} : ${issue.message}`
  })
  if (parsed.error.issues.length > MAX_ERRORS) errors.push(`… et ${parsed.error.issues.length - MAX_ERRORS} autres erreurs`)
  return { ok: false, errors }
}

// ─── Récapitulatif d'un import ────────────────────────────────────────────

export type ChangeKind = 'create' | 'update' | 'archive' | 'restore' | 'delete'

export interface BackupChange {
  section: BackupSection | 'settings'
  kind: ChangeKind
  /** Nom lisible de la ligne concernée */
  label: string
  /** Champs modifiés (libellés français), pour une modification */
  fields?: string[]
}

export const CHANGE_LABELS: Record<ChangeKind, string> = {
  create: 'Ajout',
  update: 'Modification',
  archive: 'Archivage',
  restore: 'Désarchivage',
  delete: 'Suppression',
}
