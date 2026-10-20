import { z } from 'zod'

const body = z.object({
  name: z.string().min(1).max(60),
  scopes: z.array(z.enum(['read', 'write', 'publish'])).min(1),
  expiresInDays: z.number().int().min(1).max(365).nullable().default(90),
})

/** Crée un jeton MCP pour l'utilisateur connecté. La valeur n'est renvoyée qu'une fois. */
export default defineEventHandler(async (event) => {
  const { user } = await requireAdmin(event)
  const { name, scopes, expiresInDays } = await readValidatedBody(event, body.parse)
  const normalized = [...new Set(['read' as const, ...scopes])]
  const { token, row } = await createApiToken(user.id, name, normalized, expiresInDays)
  return { token, id: row.id }
})
