import { desc, eq } from 'drizzle-orm'
import * as s from '../../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const status = getQuery(event).status
  const db = await readyDb()
  let query = db.select().from(s.changesets).$dynamic()
  if (status === 'draft' || status === 'published' || status === 'discarded') query = query.where(eq(s.changesets.status, status))
  return query.orderBy(desc(s.changesets.createdAt)).limit(100)
})
