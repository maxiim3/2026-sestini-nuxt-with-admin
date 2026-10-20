import { desc } from 'drizzle-orm'
import * as s from '../../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return (await readyDb()).select().from(s.media).orderBy(desc(s.media.createdAt)).limit(200)
})
