import type { ModalKind } from './constants'

export interface ModalCandidate {
  id: string
  kind: ModalKind
  enabled: boolean
  priority: number
  startsAt: string | null
  endsAt: string | null
  updatedAt: string
}

/**
 * Message de modale à afficher à l'instant `now` (ISO) :
 * actif, dans sa fenêtre de dates, le plus prioritaire, puis le plus récent.
 */
export function pickModalMessage<T extends ModalCandidate>(messages: T[], now: string): T | null {
  const active = messages.filter(m =>
    m.enabled
    && (!m.startsAt || m.startsAt <= now)
    && (!m.endsAt || now < m.endsAt),
  )
  active.sort((a, b) => b.priority - a.priority || b.updatedAt.localeCompare(a.updatedAt))
  return active[0] ?? null
}
