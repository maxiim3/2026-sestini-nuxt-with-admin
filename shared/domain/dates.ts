import { TIMEZONE, type Weekday } from './constants'

/** Date du jour au format AAAA-MM-JJ, à l'heure de Paris */
export function isoDateInParis(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date)
}

/** Heure courante « HH:MM » à l'heure de Paris */
export function timeInParis(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(date)
}

/** Jour ISO (1 = lundi … 7 = dimanche) d'une date AAAA-MM-JJ */
export function isoWeekday(isoDate: string): Weekday {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number]
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return (day === 0 ? 7 : day) as Weekday
}

export function addDays(isoDate: string, days: number): string {
  const [y, m, d] = isoDate.split('-').map(Number) as [number, number, number]
  const date = new Date(Date.UTC(y, m - 1, d + days))
  return date.toISOString().slice(0, 10)
}

/** Compare deux dates AAAA-MM-JJ (ordre lexicographique = ordre chronologique) */
export function isWithin(isoDate: string, start: string | null, end: string | null): boolean {
  if (start && isoDate < start) return false
  if (end && isoDate > end) return false
  return true
}

/** « 18:00 » → « 18h », « 18:30 » → « 18h30 » */
export function formatHour(hhmm: string): string {
  const [h, m] = hhmm.split(':')
  return m && m !== '00' ? `${Number(h)}h${m}` : `${Number(h)}h`
}
