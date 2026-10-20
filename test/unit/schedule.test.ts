import { describe, expect, it } from 'vitest'
import { isoWeekday } from '../../shared/domain/dates'
import { activeSeason, resolveDay, type ScheduleData, tonight } from '../../shared/domain/schedule'

const loc = (id: string) => ({ id, slug: id, name: id, address: '', city: id, zip: '34000', lat: 0, lng: 0 })

const data: ScheduleData = {
  locations: [loc('pignan'), loc('vic'), loc('villeneuve'), loc('centre')],
  seasons: [
    {
      id: 'hors-saison',
      name: 'Hors saison',
      startsOn: null,
      endsOn: null,
      priority: 0,
      isDefault: true,
      slots: [
        { weekday: 3, locationId: 'pignan', opensAt: '18:00', closesAt: '21:00' },
        { weekday: 4, locationId: 'vic', opensAt: '18:00', closesAt: '21:00' },
        { weekday: 6, locationId: 'villeneuve', opensAt: '18:00', closesAt: '22:00' },
      ],
    },
    {
      id: 'ete',
      name: 'Été',
      startsOn: '2026-07-01',
      endsOn: '2026-08-15',
      priority: 10,
      isDefault: false,
      slots: [{ weekday: 1, locationId: 'pignan', opensAt: '18:00', closesAt: '21:00' }],
    },
  ],
  exceptions: [
    { id: 'event', kind: 'relocated', startsOn: '2026-09-26', endsOn: '2026-09-26', locationId: 'centre', opensAt: null, closesAt: null, note: 'Événement' },
    { id: 'vacances', kind: 'closed', startsOn: '2026-12-21', endsOn: '2027-01-05', locationId: null, opensAt: null, closesAt: null, note: 'Congés' },
  ],
}

describe('dates', () => {
  it('calcule le jour ISO', () => {
    expect(isoWeekday('2026-10-19')).toBe(1) // lundi
    expect(isoWeekday('2026-10-25')).toBe(7) // dimanche
  })
})

describe('planning', () => {
  it('prend la saison datée la plus prioritaire, sinon la saison par défaut', () => {
    expect(activeSeason(data.seasons, '2026-07-14')?.id).toBe('ete')
    expect(activeSeason(data.seasons, '2026-10-21')?.id).toBe('hors-saison')
  })

  it('résout un jour ordinaire', () => {
    const day = resolveDay(data, '2026-10-21') // mercredi
    expect(day.open).toBe(true)
    expect(day.location?.id).toBe('pignan')
    expect(day.opensAt).toBe('18:00')
  })

  it('un jour sans créneau est fermé', () => {
    expect(resolveDay(data, '2026-10-20').open).toBe(false) // mardi
  })

  it('applique un changement de lieu ponctuel', () => {
    const day = resolveDay(data, '2026-09-26') // samedi
    expect(day.location?.id).toBe('centre')
    expect(day.opensAt).toBe('18:00')
    expect(day.exception?.id).toBe('event')
  })

  it('applique une fermeture sur une période', () => {
    expect(resolveDay(data, '2026-12-23').open).toBe(false)
    expect(resolveDay(data, '2027-01-06').open).toBe(true) // mercredi après les congés
  })
})

describe('ce soir', () => {
  it('ouvre plus tard dans la journée', () => {
    const t = tonight(data, new Date('2026-10-21T10:00:00Z'))
    expect(t.status).toBe('opens-later')
  })

  it('est ouvert à 19h heure de Paris', () => {
    const t = tonight(data, new Date('2026-10-21T17:00:00Z'))
    expect(t.status).toBe('open-now')
  })

  it('donne le prochain jour d’ouverture quand on est fermé', () => {
    const t = tonight(data, new Date('2026-10-20T17:00:00Z'))
    expect(t.status).toBe('closed-today')
    expect(t.next?.date).toBe('2026-10-21')
  })
})
