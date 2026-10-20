import type { SiteDay } from '~/composables/useSite'
import { linePath, offsetLine, project, routeBetween, type Pt } from './geo'
import { cityKey } from './copy'

export type TourLocation = NonNullable<SiteDay['location']>

/** Une étape de la carte : une ville et les jours où le camion s'y arrête */
export interface TourStop {
  key: string
  city: string
  location: TourLocation
  at: Pt
  /** Numéro d'apparition dans la semaine (I, II, III…) */
  order: number
  dates: string[]
}

export interface TourDay {
  day: SiteDay
  stop: TourStop | null
  /** Où se trouve le camion ce jour-là (même s'il est fermé) */
  at: Pt
  /** Jour ouvert suivant, pour les jours de relâche */
  next: SiteDay | null
}

export interface TourRoute {
  d: string
  /** Polyligne échantillonnée et longueurs cumulées, pour placer le camion */
  pts: Pt[]
  cum: number[]
  total: number
  /** Distance parcourue à l'arrivée de chaque jour */
  arrivals: number[]
}

/** La semaine à venir (7 jours) mise en scène : étapes, trajets, relâches */
export function useTour() {
  const { data } = useSite()

  const days = computed<SiteDay[]>(() => (data.value?.week ?? []).slice(0, 7))

  const stops = computed<TourStop[]>(() => {
    const map = new Map<string, TourStop>()
    for (const day of days.value) {
      if (!day.open || !day.location) continue
      const key = cityKey(day.location.city)
      const existing = map.get(key)
      if (existing) existing.dates.push(day.date)
      else map.set(key, {
        key,
        city: day.location.city,
        location: day.location,
        at: project(day.location.lat, day.location.lng),
        order: map.size + 1,
        dates: [day.date],
      })
    }
    // Semaine entièrement fermée : on montre quand même les lieux habituels
    if (!map.size) {
      for (const location of data.value?.locations ?? []) {
        const key = cityKey(location.city)
        if (!map.has(key)) map.set(key, { key, city: location.city, location, at: project(location.lat, location.lng), order: map.size + 1, dates: [] })
      }
    }
    return [...map.values()]
  })

  const tourDays = computed<TourDay[]>(() => {
    const list = days.value
    const all = data.value?.week ?? []
    const stopOf = (day: SiteDay | undefined) => (day?.open && day.location ? stops.value.find(s => s.key === cityKey(day.location!.city)) ?? null : null)
    const fallback = stops.value[0]?.at ?? project(43.6108, 3.8767)
    return list.map((day, i) => {
      const stop = stopOf(day)
      const next = all.slice(i + 1).find(d => d.open && d.location) ?? null
      const prev = list.slice(0, i).reverse().find(d => d.open && d.location)
      // Jour fermé : le camion attend là où il repartira (ou là où il s'est arrêté)
      const nextInWeek = list.slice(i + 1).find(d => d.open && d.location)
      const at = stop?.at ?? stopOf(nextInWeek)?.at ?? stopOf(prev)?.at ?? fallback
      return { day, stop, at, next }
    })
  })

  const route = computed<TourRoute>(() => {
    const pts: Pt[] = []
    const arrivals: number[] = []
    const cum: number[] = []
    let total = 0
    const push = (p: Pt) => {
      const last = pts[pts.length - 1]
      if (last) total += Math.hypot(p.x - last.x, p.y - last.y)
      pts.push(p)
      cum.push(total)
    }
    tourDays.value.forEach((d, i) => {
      if (i === 0) push(d.at)
      else {
        const from = tourDays.value[i - 1]!.at
        if (from.x !== d.at.x || from.y !== d.at.y) offsetLine(routeBetween(from, d.at), 3.2).slice(1).forEach(push)
      }
      arrivals.push(total)
    })
    return { d: linePath(pts), pts, cum, total, arrivals }
  })

  /** Le rendez-vous à mettre en avant : ce soir si le four s'allume, sinon le prochain */
  const tonight = computed(() => {
    const t = data.value?.tonight
    if (!t) return { mode: 'none' as const, day: null }
    if (t.today.open && t.today.location && t.status !== 'closed-now')
      return { mode: t.status === 'open-now' ? 'open-now' as const : 'later' as const, day: t.today }
    if (t.next?.location) return { mode: t.status === 'closed-now' ? 'over' as const : 'rest' as const, day: t.next }
    return { mode: 'none' as const, day: null }
  })

  return { days, stops, tourDays, route, tonight, today: computed(() => data.value?.tonight.today.date ?? '') }
}

/** Point situé à une distance donnée le long du tracé, et sens de la marche */
export function pointAt(route: TourRoute, dist: number): { p: Pt, dir: 1 | -1 | 0 } {
  const { pts, cum } = route
  if (pts.length < 2) return { p: pts[0] ?? { x: 0, y: 0 }, dir: 0 }
  const d = Math.max(0, Math.min(route.total, dist))
  let lo = 0, hi = cum.length - 1
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1
    if (cum[mid]! < d) lo = mid
    else hi = mid
  }
  const a = pts[lo]!, b = pts[hi]!
  const span = cum[hi]! - cum[lo]! || 1
  const t = (d - cum[lo]!) / span
  const dx = b.x - a.x
  return { p: { x: a.x + dx * t, y: a.y + (b.y - a.y) * t }, dir: Math.abs(dx) < 0.05 ? 0 : dx > 0 ? 1 : -1 }
}

export const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII']
