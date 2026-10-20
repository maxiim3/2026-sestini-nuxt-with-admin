import { eq } from 'drizzle-orm'
import * as s from '../../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  await (await readyDb()).update(s.apiTokens).set({ revokedAt: new Date().toISOString() }).where(eq(s.apiTokens.id, id))
  return { ok: true }
})
