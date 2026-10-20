import { z } from 'zod'
import * as s from '../../../database/schema'

const body = z.object({
  email: z.string().email().transform(v => v.trim().toLowerCase()),
  name: z.string().max(80).optional(),
  role: z.enum(['owner', 'editor']).default('editor'),
})

/** Ajout d'un utilisateur autorisé à l'admin (propriétaire uniquement) */
export default defineEventHandler(async (event) => {
  await requireOwner(event)
  const data = await readValidatedBody(event, body.parse)
  const [user] = await (await readyDb()).insert(s.users).values(data).onConflictDoNothing().returning()
  if (!user) throw createError({ statusCode: 409, statusMessage: 'Cet utilisateur existe déjà' })
  return user
})
