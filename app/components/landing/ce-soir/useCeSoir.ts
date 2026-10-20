import { formatHour } from '~~/shared/domain/dates'
import { COPY, type CeSoirCopy } from './copy'

type Tone = 'caps' | 'star'
export interface HeadlineLine { text: string, tone: Tone }
export type HeroKind = 'live' | 'later' | 'after' | 'rest' | 'none'

/** Capitale initiale, sans toucher au reste */
export function capitalize(text: string): string {
  return text ? text.charAt(0).toLocaleUpperCase() + text.slice(1) : text
}

/** Ajoute des jours à une date AAAA-MM-JJ */
function shift(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number) as [number, number, number]
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10)
}

/**
 * État partagé de la variante « Ce soir » : textes, statut du soir, jour concerné,
 * phrase d'accroche composée à partir des données.
 */
export function useCeSoir() {
  const { locale } = useI18n()
  const { data } = useSite()
  const { date } = useLocalized()

  const c = computed<CeSoirCopy>(() => COPY[locale.value as keyof typeof COPY] ?? COPY.fr)

  /** « 18h » en français, « 6 pm » en anglais, « 18:00 » en espagnol et en italien */
  function hour(hhmm: string | null | undefined): string {
    if (!hhmm) return ''
    if (locale.value === 'fr') return formatHour(hhmm)
    if (locale.value === 'en') {
      const [h, m] = hhmm.split(':').map(Number) as [number, number]
      const suffix = h >= 12 ? 'pm' : 'am'
      const h12 = h % 12 || 12
      return m ? `${h12}.${String(m).padStart(2, '0')} ${suffix}` : `${h12} ${suffix}`
    }
    const [h, m] = hhmm.split(':')
    return `${Number(h)}:${m}`
  }

  const weekday = (iso: string) => date(iso, { weekday: 'long' })

  const tonight = computed(() => data.value?.tonight ?? null)
  const today = computed(() => tonight.value?.today.date ?? '')

  const kind = computed<HeroKind>(() => {
    const t = tonight.value
    if (!t) return 'none'
    if (t.status === 'open-now' && t.today.location) return 'live'
    if (t.status === 'opens-later' && t.today.location) return 'later'
    if (!t.next?.location) return 'none'
    return t.status === 'closed-now' ? 'after' : 'rest'
  })

  /** Le jour dont parle la page : ce soir s'il y a service, sinon la prochaine ouverture */
  const day = computed(() => {
    const t = tonight.value
    if (!t) return null
    if (kind.value === 'live' || kind.value === 'later') return t.today
    return kind.value === 'none' ? null : t.next
  })

  const isTomorrow = computed(() => !!day.value && !!today.value && day.value.date === shift(today.value, 1))

  /** « demain » ou « mercredi 21 octobre » */
  const when = computed(() => {
    if (!day.value) return ''
    return isTomorrow.value ? c.value.hero.tomorrow : date(day.value.date, { weekday: 'long', day: 'numeric', month: 'long' })
  })

  const headline = computed(() => {
    const h = c.value.hero
    const d = day.value
    const city = d?.location?.city ?? ''
    let lines: HeadlineLine[]
    let lead: string
    switch (kind.value) {
      case 'live':
        lines = [{ text: h.tonight, tone: 'caps' }, { text: `${city}.`, tone: 'star' }, { text: d?.closesAt ? h.until(hour(d.closesAt)) : h.from(hour(d?.opensAt)), tone: 'caps' }]
        lead = h.lead.live
        break
      case 'later':
        lines = [{ text: h.tonight, tone: 'caps' }, { text: `${city}.`, tone: 'star' }, { text: h.from(hour(d?.opensAt)), tone: 'caps' }]
        lead = h.lead.later
        break
      case 'after':
      case 'rest':
        lines = [{ text: h.seeYou, tone: 'caps' }, { text: h.weekday(weekday(d!.date)), tone: 'star' }, { text: h.at(city), tone: 'caps' }]
        lead = h.lead[kind.value](when.value, hour(d?.opensAt))
        break
      default:
        lines = [{ text: h.restLines[0], tone: 'caps' }, { text: h.restLines[1], tone: 'star' }, { text: h.restLines[2], tone: 'caps' }]
        lead = h.lead.none
    }
    return { kicker: h.kicker[kind.value], lines, lead }
  })

  return { c, hour, weekday, date, data, tonight, today, kind, day, when, isTomorrow, headline }
}
