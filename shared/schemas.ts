import { z } from 'zod'
import {
  ALLERGENS,
  BASE_KINDS,
  DRINK_CATEGORIES,
  EXCEPTION_KINDS,
  INGREDIENT_KINDS,
  MENU_SECTIONS,
  MODAL_KINDS,
  TRANSLATED_LOCALES,
} from './domain/constants'

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date attendue au format AAAA-MM-JJ')
const isoDateTime = z.string().datetime({ offset: true })
const hhmm = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Heure attendue au format HH:MM')
const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug : minuscules, chiffres et tirets')
const cents = z.number().int().min(0).max(100_000)

/** Traductions : { en: { name: '…' }, es: {…}, it: {…} } */
export const translationsSchema = z.partialRecord(
  z.enum(TRANSLATED_LOCALES as [string, ...string[]]),
  z.record(z.string(), z.string()),
).nullable().optional()

export const locationInput = z.object({
  slug,
  name: z.string().min(1).describe('Nom du lieu-dit, ex. « Parking Intermarché »'),
  address: z.string().min(1),
  city: z.string().min(1),
  zip: z.string().regex(/^\d{5}$/),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  notes: z.string().nullable().optional(),
  i18n: translationsSchema,
})

export const seasonInput = z.object({
  slug,
  name: z.string().min(1),
  startsOn: isoDate.nullable().optional(),
  endsOn: isoDate.nullable().optional(),
  priority: z.number().int().default(0),
  isDefault: z.boolean().default(false),
})

export const scheduleSlotInput = z.object({
  weekday: z.number().int().min(1).max(7).describe('1 = lundi … 7 = dimanche'),
  locationId: z.string().min(1),
  opensAt: hhmm.default('18:00'),
  closesAt: hhmm.nullable().optional(),
})

export const scheduleExceptionBase = z.object({
  kind: z.enum(EXCEPTION_KINDS).describe('closed = fermé, relocated = autre lieu, hours = horaires spéciaux, extra = ouverture supplémentaire'),
  startsOn: isoDate,
  endsOn: isoDate,
  locationId: z.string().nullable().optional(),
  opensAt: hhmm.nullable().optional(),
  closesAt: hhmm.nullable().optional(),
  note: z.string().nullable().optional().describe('Texte public, ex. « Congés annuels »'),
  i18n: translationsSchema,
})
export const scheduleExceptionInput = scheduleExceptionBase
  .refine(e => e.startsOn <= e.endsOn, { message: 'La date de fin précède la date de début' })

export const ingredientInput = z.object({
  slug,
  name: z.string().min(1),
  kind: z.enum(INGREDIENT_KINDS).default('autre'),
  allergens: z.array(z.enum(ALLERGENS)).default([]),
  origin: z.string().nullable().optional(),
  i18n: translationsSchema,
})

/** Image : adresse complète (Vercel Blob…) ou chemin du site (/images/…, /media/… en local et en démo) */
export const imageUrl = z.string().refine(
  v => /^https?:\/\/\S+$/.test(v) || /^\/(?!\/)\S*$/.test(v),
  'Adresse d\'image invalide : https://… ou /chemin/du/site',
)

export const pizzaInput = z.object({
  slug,
  name: z.string().min(1),
  baseKind: z.enum(BASE_KINDS),
  baseLabel: z.string().min(1).describe('Libellé de la base, ex. « Crème de potimarron »'),
  priceCents: cents,
  imageUrl: imageUrl.nullable().optional(),
  imageAlt: z.string().nullable().optional(),
  extraAllergens: z.array(z.enum(ALLERGENS)).default([]),
  notes: z.string().nullable().optional(),
  i18n: translationsSchema,
})

export const menuInput = z.object({
  slug,
  name: z.string().min(1),
  status: z.enum(['draft', 'scheduled', 'active', 'archived']).default('draft'),
  activatesOn: isoDate.nullable().optional(),
  tagline: z.string().nullable().optional(),
  i18n: translationsSchema,
})

export const menuItemInput = z.object({
  pizzaId: z.string().min(1),
  section: z.enum(MENU_SECTIONS),
  position: z.number().int().min(0),
})

export const featuredInput = z.object({
  pizzaId: z.string().min(1),
  title: z.string().min(1).default('La Pizza du Moment'),
  pitch: z.string().nullable().optional(),
  startsOn: isoDate.nullable().optional(),
  endsOn: isoDate.nullable().optional(),
  showOnHome: z.boolean().default(true),
  showOnMenu: z.boolean().default(true),
  showInModal: z.boolean().default(false),
  priority: z.number().int().default(0),
  i18n: translationsSchema,
})

export const supplementInput = z.object({
  label: z.string().min(1),
  priceCents: cents,
  position: z.number().int().default(0),
  i18n: translationsSchema,
})

export const drinkInput = z.object({
  name: z.string().min(1),
  volume: z.string().nullable().optional(),
  category: z.enum(DRINK_CATEGORIES).default('soft'),
  priceCents: cents,
  position: z.number().int().default(0),
  i18n: translationsSchema,
})

export const dessertInput = z.object({
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  priceCents: cents,
  allergens: z.array(z.enum(ALLERGENS)).default([]),
  position: z.number().int().default(0),
  i18n: translationsSchema,
})

export const modalCtaInput = z.object({
  label: z.string().min(1),
  href: z.string().min(1),
  variant: z.enum(['primary', 'secondary']).optional(),
})

export const modalMessageInput = z.object({
  kind: z.enum(MODAL_KINDS),
  title: z.string().min(1),
  body: z.string().min(1).describe('Markdown léger : paragraphes séparés par une ligne vide, **gras**'),
  imageUrl: z.string().nullable().optional(),
  ctas: z.array(modalCtaInput).default([]),
  startsAt: isoDateTime.nullable().optional(),
  endsAt: isoDateTime.nullable().optional(),
  priority: z.number().int().default(0),
  enabled: z.boolean().default(true),
  i18n: translationsSchema,
})

/** Entités modifiables de façon générique (création, mise à jour, archivage) */
export const ENTITY_SCHEMAS = {
  location: locationInput,
  season: seasonInput,
  scheduleException: scheduleExceptionBase,
  ingredient: ingredientInput,
  pizza: pizzaInput,
  menu: menuInput,
  featured: featuredInput,
  supplement: supplementInput,
  drink: drinkInput,
  dessert: dessertInput,
  modalMessage: modalMessageInput,
} as const
export type EntityName = keyof typeof ENTITY_SCHEMAS
export const ENTITY_NAMES = Object.keys(ENTITY_SCHEMAS) as [EntityName, ...EntityName[]]

/** Une opération d'écriture. Une liste d'opérations = un changeset (brouillon ou publication). */
export const operationSchema = z.discriminatedUnion('op', [
  z.object({ op: z.literal('create'), entity: z.enum(ENTITY_NAMES), data: z.record(z.string(), z.unknown()), ref: z.string().optional().describe('Alias réutilisable dans les opérations suivantes, ex. « $nouvelle-pizza »') }),
  z.object({ op: z.literal('update'), entity: z.enum(ENTITY_NAMES), id: z.string(), data: z.record(z.string(), z.unknown()) }),
  z.object({ op: z.literal('archive'), entity: z.enum(ENTITY_NAMES), id: z.string() }),
  z.object({ op: z.literal('restore'), entity: z.enum(ENTITY_NAMES), id: z.string() }),
  z.object({ op: z.literal('delete'), entity: z.enum(['scheduleException', 'modalMessage', 'featured']), id: z.string() }),
  z.object({
    op: z.literal('setPizzaIngredients'),
    pizzaId: z.string(),
    avant: z.array(z.string()).describe('Ingrédients avant cuisson : id, slug ou nom (créé s\'il n\'existe pas)'),
    apres: z.array(z.string()).describe('Ingrédients après cuisson : id, slug ou nom'),
  }),
  z.object({ op: z.literal('setScheduleSlots'), seasonId: z.string(), slots: z.array(scheduleSlotInput) }),
  z.object({ op: z.literal('setMenuItems'), menuId: z.string(), items: z.array(menuItemInput) }),
  z.object({ op: z.literal('activateMenu'), menuId: z.string() }),
  z.object({ op: z.literal('setSetting'), key: z.string().min(1), value: z.unknown() }),
  z.object({ op: z.literal('restoreRevision'), revisionId: z.string() }),
])
export type Operation = z.infer<typeof operationSchema>
