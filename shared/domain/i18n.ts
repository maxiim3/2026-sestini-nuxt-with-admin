import type { Locale } from './constants'

/** Champs traduits stockés en base : { en: { name: '…' }, es: {…} } */
export type Translations<T extends string = string> = Partial<Record<Exclude<Locale, 'fr'>, Partial<Record<T, string>>>>

/** Valeur traduite d'un champ, avec repli sur le français */
export function translated<T extends Record<string, unknown>, K extends keyof T & string>(
  entity: T & { i18n?: Translations | null },
  field: K,
  locale: Locale,
): T[K] {
  if (locale === 'fr') return entity[field]
  const value = entity.i18n?.[locale]?.[field]
  return (value ?? entity[field]) as T[K]
}
