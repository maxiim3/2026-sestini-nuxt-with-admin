import { desc, eq } from 'drizzle-orm'
import * as s from '../../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const db = await readyDb()
  return db.select({
    id: s.apiTokens.id,
    name: s.apiTokens.name,
    prefix: s.apiTokens.prefix,
    scopes: s.apiTokens.scopes,
    expiresAt: s.apiTokens.expiresAt,
    lastUsedAt: s.apiTokens.lastUsedAt,
    revokedAt: s.apiTokens.revokedAt,
    createdAt: s.apiTokens.createdAt,
    owner: s.users.email,
  }).from(s.apiTokens).innerJoin(s.users, eq(s.users.id, s.apiTokens.userId)).orderBy(desc(s.apiTokens.createdAt))
})
