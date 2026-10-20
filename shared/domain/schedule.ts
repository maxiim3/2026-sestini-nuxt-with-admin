import type { ExceptionKind, Weekday } from './constants'
import { addDays, isoDateInParis, isoWeekday, isWithin, timeInParis } from './dates'

export interface ScheduleLocation {
  id: string
  slug: string
  name: string
  address: string
  city: string
  zip: string
  lat: number
  lng: number
}

export interface ScheduleSeason {
  id: string
  name: string
  startsOn: string | null
  endsOn: string | null
  priority: number
  isDefault: boolean
  slots: { weekday: Weekday, locationId: string, opensAt: string, closesAt: string | null }[]
}

export interface ScheduleException {
  id: string
  kind: ExceptionKind
  startsOn: string
  endsOn: string
  locationId: string | null
  opensAt: string | null
  closesAt: string | null
  note: string | null
}

export interface ScheduleData {
  locations: ScheduleLocation[]
  seasons: ScheduleSeason[]
  exceptions: ScheduleException[]
}

export interface ResolvedDay {
  date: string
  weekday: Weekday
  open: boolean
  location: ScheduleLocation | null
  opensAt: string | null
  closesAt: string | null
  seasonId: string | null
  exception: ScheduleException | null
}

/** Saison applicable à une date : la plus prioritaire dont les dates couvrent le jour, sinon la saison par défaut */
export function activeSeason(seasons: ScheduleSeason[], date: string): ScheduleSeason | null {
  const dated = seasons
    .filter(s => !s.isDefault && (s.startsOn || s.endsOn) && isWithin(date, s.startsOn, s.endsOn))
    .sort((a, b) => b.priority - a.priority)
  return dated[0] ?? seasons.find(s => s.isDefault) ?? null
}

/** Exception applicable : la plus récente (la plus courte en cas d'égalité) qui couvre le jour */
export function activeException(exceptions: ScheduleException[], date: string): ScheduleException | null {
  const matching = exceptions
    .filter(e => isWithin(date, e.startsOn, e.endsOn))
    .sort((a, b) => (b.startsOn.localeCompare(a.startsOn)) || (a.endsOn.localeCompare(b.endsOn)))
  return matching[0] ?? null
}

/** Ce qui se passe un jour donné : exception du jour, sinon planning de la saison */
export function resolveDay(data: ScheduleData, date: string): ResolvedDay {
  const weekday = isoWeekday(date)
  const season = activeSeason(data.seasons, date)
  const slot = season?.slots.find(s => s.weekday === weekday) ?? null
  const exception = activeException(data.exceptions, date)
  const findLocation = (id: string | null) => data.locations.find(l => l.id === id) ?? null

  const base: ResolvedDay = {
    date,
    weekday,
    open: Boolean(slot),
    location: findLocation(slot?.locationId ?? null),
    opensAt: slot?.opensAt ?? null,
    closesAt: slot?.closesAt ?? null,
    seasonId: season?.id ?? null,
    exception: null,
  }

  if (!exception) return base

  switch (exception.kind) {
    case 'closed':
      return { ...base, open: false, location: null, opensAt: null, closesAt: null, exception }
    case 'relocated':
      return {
        ...base,
        open: true,
        location: findLocation(exception.locationId) ?? base.location,
        opensAt: exception.opensAt ?? base.opensAt ?? '18:00',
        closesAt: exception.closesAt ?? base.closesAt,
        exception,
      }
    case 'hours':
      if (!base.open) return base
      return {
        ...base,
        opensAt: exception.opensAt ?? base.opensAt,
        closesAt: exception.closesAt ?? base.closesAt,
        exception,
      }
    case 'extra':
      return {
        ...base,
        open: true,
        location: findLocation(exception.locationId) ?? base.location,
        opensAt: exception.opensAt ?? '18:00',
        closesAt: exception.closesAt,
        exception,
      }
  }
}

export function resolveRange(data: ScheduleData, from: string, days: number): ResolvedDay[] {
  return Array.from({ length: days }, (_, i) => resolveDay(data, addDays(from, i)))
}

/** Prochain jour d'ouverture à partir d'une date (incluse), sur 60 jours maximum */
export function nextOpenDay(data: ScheduleData, from: string): ResolvedDay | null {
  for (let i = 0; i < 60; i++) {
    const day = resolveDay(data, addDays(from, i))
    if (day.open) return day
  }
  return null
}

export type TonightStatus = 'open-now' | 'opens-later' | 'closed-now' | 'closed-today'

export interface Tonight {
  today: ResolvedDay
  status: TonightStatus
  next: ResolvedDay | null
}

/** État « ce soir » à l'instant `now`. Sans heure de fermeture, on considère 22h. */
export function tonight(data: ScheduleData, now: Date = new Date()): Tonight {
  const date = isoDateInParis(now)
  const time = timeInParis(now)
  const today = resolveDay(data, date)
  const next = nextOpenDay(data, addDays(date, 1))

  if (!today.open) return { today, status: 'closed-today', next }
  if (today.opensAt && time < today.opensAt) return { today, status: 'opens-later', next }
  if (time < (today.closesAt ?? '22:00')) return { today, status: 'open-now', next }
  return { today, status: 'closed-now', next }
}
