import { LOCALES, type Locale } from './constants'

/**
 * Atelier d'impression : modèles, formats et paramètres des documents
 * imprimables (/print/<modele>). Partagé par les pages, l'atelier et l'outil MCP.
 */

export const PRINT_FORMATS = ['A5', 'A4', 'A3'] as const
export type PrintFormat = (typeof PRINT_FORMATS)[number]

export const PRINT_ORIENTATIONS = ['portrait', 'landscape'] as const
export type PrintOrientation = (typeof PRINT_ORIENTATIONS)[number]

/** clair = fond farine, économe en encre ; sombre = fond charbon, pour l'affichage */
export const PRINT_THEMES = ['clair', 'sombre'] as const
export type PrintTheme = (typeof PRINT_THEMES)[number]

/** Dimensions en mm (portrait) */
export const PAGE_SIZES_MM: Record<PrintFormat, { width: number, height: number }> = {
  A5: { width: 148, height: 210 },
  A4: { width: 210, height: 297 },
  A3: { width: 297, height: 420 },
}

/** Échelle typographique relative à l'A4 (rapport √2 entre deux formats) */
export const FORMAT_SCALE: Record<PrintFormat, number> = { A5: Math.SQRT1_2, A4: 1, A3: Math.SQRT2 }

export const PRINT_MODELS = ['carte', 'pizza-du-moment', 'fermeture', 'evenement', 'semaine'] as const
export type PrintModel = (typeof PRINT_MODELS)[number]

export interface PrintParamSpec {
  name: string
  description: string
}

export interface PrintModelSpec {
  model: PrintModel
  label: string
  description: string
  formats: PrintFormat[]
  defaultFormat: PrintFormat
  params: PrintParamSpec[]
}

export const PRINT_MODEL_SPECS: Record<PrintModel, PrintModelSpec> = {
  'carte': {
    model: 'carte',
    label: 'La carte',
    description: 'Carte complète : rouges, blanches, spéciales, prix, ingrédients, allergènes, suppléments, boissons, téléphone et semaine type. Tient sur un A4 recto, spectaculaire en A3.',
    formats: ['A4', 'A3'],
    defaultFormat: 'A4',
    params: [
      { name: 'menu', description: 'Id d\'une carte (défaut : la carte active)' },
    ],
  },
  'pizza-du-moment': {
    model: 'pizza-du-moment',
    label: 'Pizza du moment',
    description: 'Flyer ou affiche de la pizza du moment : grand titre, ingrédients, prix, photo si disponible.',
    formats: ['A5', 'A4', 'A3'],
    defaultFormat: 'A5',
    params: [
      { name: 'featured', description: 'Id d\'une pizza du moment (défaut : celle en cours, sinon la plus récente)' },
      { name: 'pizza', description: 'Id ou slug d\'une pizza quelconque, à la place de « featured »' },
      { name: 'title', description: 'Surtitre (défaut : titre de la pizza du moment)' },
      { name: 'body', description: 'Phrase d\'accroche (défaut : accroche de la pizza du moment)' },
    ],
  },
  'fermeture': {
    model: 'fermeture',
    label: 'Fermeture / vacances',
    description: 'Affiche de fermeture exceptionnelle ou de congés : dates, message, date de retour calculée d\'après le planning.',
    formats: ['A5', 'A4', 'A3'],
    defaultFormat: 'A4',
    params: [
      { name: 'exception', description: 'Id d\'une exception de planning de type « closed » (défaut : la prochaine fermeture)' },
      { name: 'from', description: 'Premier jour fermé AAAA-MM-JJ (à la place de « exception »)' },
      { name: 'to', description: 'Dernier jour fermé AAAA-MM-JJ (défaut : « from »)' },
      { name: 'message', description: 'Id d\'un message de modale dont reprendre le titre et le texte (défaut : celui de la même période ; « none » : aucun)' },
      { name: 'title', description: 'Titre libre' },
      { name: 'body', description: 'Texte libre (markdown léger : **gras**, paragraphes)' },
    ],
  },
  'evenement': {
    model: 'evenement',
    label: 'Événement',
    description: 'Annonce d\'un lieu ponctuel : date, lieu, adresse, heure d\'ouverture, texte.',
    formats: ['A5', 'A4', 'A3'],
    defaultFormat: 'A4',
    params: [
      { name: 'exception', description: 'Id d\'une exception « relocated » ou « extra » (défaut : le prochain événement, sinon le plus récent)' },
      { name: 'message', description: 'Id d\'un message de modale dont reprendre le titre et le texte (défaut : celui de la même période ; « none » : aucun)' },
      { name: 'title', description: 'Titre libre' },
      { name: 'body', description: 'Texte libre (markdown léger)' },
    ],
  },
  'semaine': {
    model: 'semaine',
    label: 'La tournée de la semaine',
    description: 'Les sept jours de la semaine : lieux, adresses, heure d\'ouverture, exceptions comprises.',
    formats: ['A5', 'A4', 'A3'],
    defaultFormat: 'A4',
    params: [
      { name: 'from', description: 'Une date de la semaine voulue AAAA-MM-JJ (défaut : cette semaine, du lundi au dimanche)' },
    ],
  },
}

export const COMMON_PRINT_PARAMS: PrintParamSpec[] = [
  { name: 'format', description: 'A5 | A4 | A3' },
  { name: 'orientation', description: 'portrait (défaut) | landscape' },
  { name: 'theme', description: 'clair (défaut, fond farine, économe en encre) | sombre (fond charbon, affichage)' },
  { name: 'lang', description: 'fr (défaut) | en | es | it' },
]

export interface PrintOptions {
  format: PrintFormat
  orientation: PrintOrientation
  theme: PrintTheme
  lang: Locale
}

export function isPrintModel(value: unknown): value is PrintModel {
  return typeof value === 'string' && (PRINT_MODELS as readonly string[]).includes(value)
}

function pick<T extends string>(values: readonly T[], value: unknown, fallback: T): T {
  const v = Array.isArray(value) ? value[0] : value
  return typeof v === 'string' && (values as readonly string[]).includes(v) ? v as T : fallback
}

/** Options communes lues dans la query, avec valeurs par défaut */
export function parsePrintOptions(model: PrintModel, query: Record<string, unknown>): PrintOptions {
  const spec = PRINT_MODEL_SPECS[model]
  const format = typeof query.format === 'string' ? query.format.toUpperCase() : undefined
  return {
    format: pick(PRINT_FORMATS, format, spec.defaultFormat),
    orientation: pick(PRINT_ORIENTATIONS, query.orientation, 'portrait'),
    theme: pick(PRINT_THEMES, query.theme, 'clair'),
    lang: pick(LOCALES, query.lang, 'fr'),
  }
}

/** Taille de la page en mm selon le format et l'orientation */
export function pageSize(format: PrintFormat, orientation: PrintOrientation) {
  const { width, height } = PAGE_SIZES_MM[format]
  return orientation === 'landscape' ? { width: height, height: width } : { width, height }
}

/** Chemin de la page d'impression, sans les paramètres par défaut */
export function printPath(model: PrintModel, params: Record<string, string | number | boolean | null | undefined> = {}): string {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    query.set(key, String(value))
  }
  const qs = query.toString()
  return `/print/${model}${qs ? `?${qs}` : ''}`
}

/** Paramètres propres au modèle (hors format, orientation, thème, langue) */
export function modelParams(model: PrintModel, query: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const { name } of PRINT_MODEL_SPECS[model].params) {
    const raw = query[name]
    const value = Array.isArray(raw) ? raw[0] : raw
    if (typeof value === 'string' && value.trim()) out[name] = value.trim()
  }
  return out
}
