import { formatHour } from '~~/shared/domain/dates'
import type { Locale } from '~~/shared/domain/constants'
import { translated, type Translations } from '~~/shared/domain/i18n'

const TAGS: Record<Locale, string> = { fr: 'fr-FR', en: 'en-GB', es: 'es-ES', it: 'it-IT' }

/** Aides de formatage selon la langue courante (contenus traduits, prix, dates, heures) */
export function useLocalized() {
  const { locale, t } = useI18n()
  const tag = computed(() => TAGS[locale.value as Locale] ?? 'fr-FR')

  function tr<T extends Record<string, unknown> & { i18n?: Translations | null }, K extends keyof T & string>(entity: T, field: K): T[K] {
    return translated(entity, field, locale.value as Locale)
  }

  function price(cents: number): string {
    return new Intl.NumberFormat(tag.value, {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    }).format(cents / 100)
  }

  function hour(hhmm: string | null | undefined): string {
    if (!hhmm) return ''
    if (locale.value === 'fr') return formatHour(hhmm)
    const [h, m] = hhmm.split(':').map(Number) as [number, number]
    return new Intl.DateTimeFormat(tag.value, { hour: 'numeric', minute: '2-digit', timeZone: 'UTC' })
      .format(new Date(Date.UTC(2026, 0, 1, h, m)))
  }

  function date(iso: string, options: Intl.DateTimeFormatOptions = { weekday: 'long', day: 'numeric', month: 'long' }): string {
    const [y, mo, d] = iso.split('-').map(Number) as [number, number, number]
    return new Intl.DateTimeFormat(tag.value, { ...options, timeZone: 'UTC' }).format(new Date(Date.UTC(y, mo - 1, d)))
  }

  /** « Aujourd'hui », « Demain » ou « jeudi 23 octobre » */
  function relativeDay(iso: string, today: string): string {
    if (iso === today) return t('days.today')
    const [y, mo, d] = today.split('-').map(Number) as [number, number, number]
    const tomorrow = new Date(Date.UTC(y, mo - 1, d + 1)).toISOString().slice(0, 10)
    if (iso === tomorrow) return t('days.tomorrow')
    return date(iso)
  }

  return { tr, price, hour, date, relativeDay, tag }
}
