import { describe, expect, it } from 'vitest'
import { pickModalMessage } from '../../shared/domain/modal'

const base = { enabled: true, priority: 0, startsAt: null, endsAt: null, updatedAt: '2026-01-01T00:00:00Z' }

describe('message de modale', () => {
  const messages = [
    { ...base, id: 'menu', kind: 'menu' as const, priority: 10 },
    { ...base, id: 'event', kind: 'event' as const, priority: 100, startsAt: '2026-09-25T22:00:00Z', endsAt: '2026-09-26T22:00:00Z' },
    { ...base, id: 'off', kind: 'info' as const, priority: 1000, enabled: false },
  ]

  it('choisit le message actif le plus prioritaire', () => {
    expect(pickModalMessage(messages, '2026-09-26T12:00:00Z')?.id).toBe('event')
  })

  it('revient au message permanent après la fenêtre', () => {
    expect(pickModalMessage(messages, '2026-09-27T12:00:00Z')?.id).toBe('menu')
  })

  it('ignore les messages désactivés', () => {
    expect(pickModalMessage(messages.slice(2), '2026-09-27T12:00:00Z')).toBeNull()
  })
})
