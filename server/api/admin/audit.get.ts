import { desc } from 'drizzle-orm'
import * as s from '../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return (await readyDb()).select().from(s.auditLog).orderBy(desc(s.auditLog.createdAt)).limit(100)
})
