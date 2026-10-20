import { sql } from 'drizzle-orm'
import { index, integer, primaryKey, real, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'
import type {
  Allergen,
  BaseKind,
  DrinkCategory,
  ExceptionKind,
  IngredientKind,
  MenuSection,
  ModalKind,
  Weekday,
} from '../../shared/domain/constants'
import type { Translations } from '../../shared/domain/i18n'

const id = () => text('id').primaryKey().$defaultFn(() => crypto.randomUUID())
const now = () => sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`
const createdAt = () => text('created_at').notNull().default(now())
const updatedAt = () => text('updated_at').notNull().default(now()).$onUpdateFn(() => new Date().toISOString())
/** Archivage : remplace le « code mort » de l'ancien site */
const archivedAt = () => text('archived_at')
const i18n = <T extends string>() => text('i18n', { mode: 'json' }).$type<Translations<T>>()

// ─── Accès ────────────────────────────────────────────────────────────────

export const users = sqliteTable('users', {
  id: id(),
  email: text('email').notNull().unique(),
  name: text('name'),
  role: text('role', { enum: ['owner', 'editor'] }).notNull().default('editor'),
  lastLoginAt: text('last_login_at'),
  createdAt: createdAt(),
})

export const magicLinks = sqliteTable('magic_links', {
  id: id(),
  email: text('email').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  redirect: text('redirect'),
  expiresAt: text('expires_at').notNull(),
  usedAt: text('used_at'),
  createdAt: createdAt(),
}, t => [index('magic_links_email_idx').on(t.email)])

export type TokenScope = 'read' | 'write' | 'publish'

export const apiTokens = sqliteTable('api_tokens', {
  id: id(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  prefix: text('prefix').notNull(),
  tokenHash: text('token_hash').notNull().unique(),
  scopes: text('scopes', { mode: 'json' }).$type<TokenScope[]>().notNull(),
  expiresAt: text('expires_at'),
  lastUsedAt: text('last_used_at'),
  revokedAt: text('revoked_at'),
  createdAt: createdAt(),
})

// ─── Réglages ─────────────────────────────────────────────────────────────

export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value', { mode: 'json' }).$type<unknown>().notNull(),
  updatedAt: updatedAt(),
})

// ─── Lieux et horaires ───────────────────────────────────────────────────

export const locations = sqliteTable('locations', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  address: text('address').notNull(),
  city: text('city').notNull(),
  zip: text('zip').notNull(),
  lat: real('lat').notNull(),
  lng: real('lng').notNull(),
  notes: text('notes'),
  i18n: i18n<'name' | 'notes'>(),
  archivedAt: archivedAt(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const seasons = sqliteTable('seasons', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  startsOn: text('starts_on'),
  endsOn: text('ends_on'),
  priority: integer('priority').notNull().default(0),
  isDefault: integer('is_default', { mode: 'boolean' }).notNull().default(false),
  archivedAt: archivedAt(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const scheduleSlots = sqliteTable('schedule_slots', {
  id: id(),
  seasonId: text('season_id').notNull().references(() => seasons.id, { onDelete: 'cascade' }),
  weekday: integer('weekday').$type<Weekday>().notNull(),
  locationId: text('location_id').notNull().references(() => locations.id),
  opensAt: text('opens_at').notNull().default('18:00'),
  closesAt: text('closes_at'),
}, t => [uniqueIndex('schedule_slots_season_day').on(t.seasonId, t.weekday)])

export const scheduleExceptions = sqliteTable('schedule_exceptions', {
  id: id(),
  kind: text('kind').$type<ExceptionKind>().notNull(),
  startsOn: text('starts_on').notNull(),
  endsOn: text('ends_on').notNull(),
  locationId: text('location_id').references(() => locations.id),
  opensAt: text('opens_at'),
  closesAt: text('closes_at'),
  note: text('note'),
  i18n: i18n<'note'>(),
  archivedAt: archivedAt(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

// ─── Carte ────────────────────────────────────────────────────────────────

export const ingredients = sqliteTable('ingredients', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  kind: text('kind').$type<IngredientKind>().notNull().default('autre'),
  allergens: text('allergens', { mode: 'json' }).$type<Allergen[]>().notNull().default([]),
  origin: text('origin'),
  i18n: i18n<'name'>(),
  archivedAt: archivedAt(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const pizzas = sqliteTable('pizzas', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  baseKind: text('base_kind').$type<BaseKind>().notNull(),
  baseLabel: text('base_label').notNull(),
  priceCents: integer('price_cents').notNull(),
  imageUrl: text('image_url'),
  imageAlt: text('image_alt'),
  /** Allergènes ajoutés à la main, en plus de ceux dérivés des ingrédients */
  extraAllergens: text('extra_allergens', { mode: 'json' }).$type<Allergen[]>().notNull().default([]),
  notes: text('notes'),
  i18n: i18n<'name' | 'baseLabel' | 'imageAlt'>(),
  archivedAt: archivedAt(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const pizzaIngredients = sqliteTable('pizza_ingredients', {
  pizzaId: text('pizza_id').notNull().references(() => pizzas.id, { onDelete: 'cascade' }),
  ingredientId: text('ingredient_id').notNull().references(() => ingredients.id),
  stage: text('stage', { enum: ['avant', 'apres'] }).notNull(),
  position: integer('position').notNull(),
}, t => [primaryKey({ columns: [t.pizzaId, t.stage, t.position] })])

export const menus = sqliteTable('menus', {
  id: id(),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  status: text('status', { enum: ['draft', 'scheduled', 'active', 'archived'] }).notNull().default('draft'),
  activatesOn: text('activates_on'),
  tagline: text('tagline'),
  i18n: i18n<'name' | 'tagline'>(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const menuItems = sqliteTable('menu_items', {
  menuId: text('menu_id').notNull().references(() => menus.id, { onDelete: 'cascade' }),
  pizzaId: text('pizza_id').notNull().references(() => pizzas.id),
  section: text('section').$type<MenuSection>().notNull(),
  position: integer('position').notNull(),
}, t => [primaryKey({ columns: [t.menuId, t.pizzaId] })])

/** Pizza(s) du moment */
export const featuredPizzas = sqliteTable('featured_pizzas', {
  id: id(),
  pizzaId: text('pizza_id').notNull().references(() => pizzas.id),
  title: text('title').notNull().default('La Pizza du Moment'),
  pitch: text('pitch'),
  startsOn: text('starts_on'),
  endsOn: text('ends_on'),
  showOnHome: integer('show_on_home', { mode: 'boolean' }).notNull().default(true),
  showOnMenu: integer('show_on_menu', { mode: 'boolean' }).notNull().default(true),
  showInModal: integer('show_in_modal', { mode: 'boolean' }).notNull().default(false),
  priority: integer('priority').notNull().default(0),
  i18n: i18n<'title' | 'pitch'>(),
  archivedAt: archivedAt(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const supplements = sqliteTable('supplements', {
  id: id(),
  label: text('label').notNull(),
  priceCents: integer('price_cents').notNull(),
  position: integer('position').notNull().default(0),
  i18n: i18n<'label'>(),
  archivedAt: archivedAt(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const drinks = sqliteTable('drinks', {
  id: id(),
  name: text('name').notNull(),
  volume: text('volume'),
  category: text('category').$type<DrinkCategory>().notNull().default('soft'),
  priceCents: integer('price_cents').notNull(),
  position: integer('position').notNull().default(0),
  i18n: i18n<'name'>(),
  archivedAt: archivedAt(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const desserts = sqliteTable('desserts', {
  id: id(),
  name: text('name').notNull(),
  description: text('description'),
  priceCents: integer('price_cents').notNull(),
  allergens: text('allergens', { mode: 'json' }).$type<Allergen[]>().notNull().default([]),
  position: integer('position').notNull().default(0),
  i18n: i18n<'name' | 'description'>(),
  archivedAt: archivedAt(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

// ─── Communication ────────────────────────────────────────────────────────

export interface ModalCta {
  label: string
  href: string
  variant?: 'primary' | 'secondary'
}

export const modalMessages = sqliteTable('modal_messages', {
  id: id(),
  kind: text('kind').$type<ModalKind>().notNull(),
  title: text('title').notNull(),
  /** Markdown léger : paragraphes, **gras**, listes */
  body: text('body').notNull(),
  imageUrl: text('image_url'),
  ctas: text('ctas', { mode: 'json' }).$type<ModalCta[]>().notNull().default([]),
  startsAt: text('starts_at'),
  endsAt: text('ends_at'),
  priority: integer('priority').notNull().default(0),
  enabled: integer('enabled', { mode: 'boolean' }).notNull().default(true),
  i18n: i18n<'title' | 'body'>(),
  archivedAt: archivedAt(),
  createdAt: createdAt(),
  updatedAt: updatedAt(),
})

export const media = sqliteTable('media', {
  id: id(),
  url: text('url').notNull(),
  pathname: text('pathname').notNull(),
  alt: text('alt'),
  width: integer('width'),
  height: integer('height'),
  contentType: text('content_type'),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default([]),
  createdAt: createdAt(),
})

// ─── Historique et brouillons ─────────────────────────────────────────────

export type ActorType = 'user' | 'token' | 'system'

export const changesets = sqliteTable('changesets', {
  id: id(),
  title: text('title').notNull(),
  status: text('status', { enum: ['draft', 'published', 'discarded'] }).notNull().default('draft'),
  operations: text('operations', { mode: 'json' }).$type<unknown[]>().notNull(),
  authorType: text('author_type').$type<ActorType>().notNull(),
  authorId: text('author_id'),
  authorLabel: text('author_label'),
  decidedAt: text('decided_at'),
  decidedBy: text('decided_by'),
  error: text('error'),
  createdAt: createdAt(),
})

export const revisions = sqliteTable('revisions', {
  id: id(),
  entity: text('entity').notNull(),
  entityId: text('entity_id').notNull(),
  action: text('action', { enum: ['create', 'update', 'archive', 'restore', 'delete'] }).notNull(),
  before: text('before', { mode: 'json' }).$type<Record<string, unknown> | null>(),
  after: text('after', { mode: 'json' }).$type<Record<string, unknown> | null>(),
  changesetId: text('changeset_id').references(() => changesets.id),
  authorType: text('author_type').$type<ActorType>().notNull(),
  authorId: text('author_id'),
  authorLabel: text('author_label'),
  message: text('message'),
  createdAt: createdAt(),
}, t => [index('revisions_entity_idx').on(t.entity, t.entityId)])

export const auditLog = sqliteTable('audit_log', {
  id: id(),
  tokenId: text('token_id'),
  userId: text('user_id'),
  tool: text('tool').notNull(),
  input: text('input', { mode: 'json' }).$type<unknown>(),
  ok: integer('ok', { mode: 'boolean' }).notNull(),
  error: text('error'),
  createdAt: createdAt(),
})
