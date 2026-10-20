import type { H3Event } from 'h3'
import type { Actor } from '../services/operations'

/** Exige une session admin valide et renvoie l'auteur pour l'historique */
export async function requireAdmin(event: H3Event): Promise<{ user: { id: string, email: string, name: string | null, role: 'owner' | 'editor' }, actor: Actor }> {
  const session = await requireUserSession(event)
  const user = session.user
  return { user, actor: { type: 'user', id: user.id, label: user.name ?? user.email } }
}

export async function requireOwner(event: H3Event) {
  const ctx = await requireAdmin(event)
  if (ctx.user.role !== 'owner') throw createError({ statusCode: 403, statusMessage: 'Réservé au propriétaire' })
  return ctx
}

/** Convertit les erreurs métier en 400 lisibles */
export function asHttpError(error: unknown): never {
  if (error && typeof error === 'object' && 'statusCode' in error) throw error
  const message = error instanceof Error ? error.message : String(error)
  throw createError({ statusCode: 400, statusMessage: message.slice(0, 300), data: { message } })
}
