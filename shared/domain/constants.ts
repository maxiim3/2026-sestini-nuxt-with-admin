export const LOCALES = ['fr', 'en', 'es', 'it'] as const
export type Locale = (typeof LOCALES)[number]
export const DEFAULT_LOCALE: Locale = 'fr'
export const TRANSLATED_LOCALES = LOCALES.filter(l => l !== DEFAULT_LOCALE) as Exclude<Locale, 'fr'>[]

export const TIMEZONE = 'Europe/Paris'

/** Jours ISO : 1 = lundi … 7 = dimanche */
export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const
export type Weekday = (typeof WEEKDAYS)[number]
export const WEEKDAY_SLUGS: Record<Weekday, string> = {
  1: 'lundi',
  2: 'mardi',
  3: 'mercredi',
  4: 'jeudi',
  5: 'vendredi',
  6: 'samedi',
  7: 'dimanche',
}

/** Les 14 allergènes à déclaration obligatoire (règlement UE 1169/2011) */
export const ALLERGENS = [
  'gluten',
  'crustaces',
  'oeufs',
  'poissons',
  'arachides',
  'soja',
  'lait',
  'fruits-a-coque',
  'celeri',
  'moutarde',
  'sesame',
  'sulfites',
  'lupin',
  'mollusques',
] as const
export type Allergen = (typeof ALLERGENS)[number]

export const ALLERGEN_LABELS: Record<Allergen, string> = {
  'gluten': 'Gluten',
  'crustaces': 'Crustacés',
  'oeufs': 'Œufs',
  'poissons': 'Poissons',
  'arachides': 'Arachides',
  'soja': 'Soja',
  'lait': 'Lait',
  'fruits-a-coque': 'Fruits à coque',
  'celeri': 'Céleri',
  'moutarde': 'Moutarde',
  'sesame': 'Sésame',
  'sulfites': 'Sulfites',
  'lupin': 'Lupin',
  'mollusques': 'Mollusques',
}

export const INGREDIENT_KINDS = ['fromage', 'viande', 'poisson', 'legume', 'sauce', 'herbe', 'autre'] as const
export type IngredientKind = (typeof INGREDIENT_KINDS)[number]

/** Base de la pizza : sert aux filtres de la carte */
export const BASE_KINDS = ['tomate', 'creme', 'speciale', 'sans'] as const
export type BaseKind = (typeof BASE_KINDS)[number]

export const MENU_SECTIONS = ['rouges', 'blanches', 'speciales'] as const
export type MenuSection = (typeof MENU_SECTIONS)[number]

export const DRINK_CATEGORIES = ['soft', 'eau', 'biere', 'vin'] as const
export type DrinkCategory = (typeof DRINK_CATEGORIES)[number]

export const EXCEPTION_KINDS = ['closed', 'relocated', 'hours', 'extra'] as const
export type ExceptionKind = (typeof EXCEPTION_KINDS)[number]

export const MODAL_KINDS = ['menu', 'featured', 'closure', 'event', 'info'] as const
export type ModalKind = (typeof MODAL_KINDS)[number]

/** Commun à toutes les pizzas, d'après la carte de Sestini : « Toutes nos pizzas contiennent du soja, du gluten et du lait » */
export const DOUGH_ALLERGENS: Allergen[] = ['soja', 'gluten', 'lait']
