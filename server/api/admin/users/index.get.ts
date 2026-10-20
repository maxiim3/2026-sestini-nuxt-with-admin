import { asc } from 'drizzle-orm'
import * as s from '../../../database/schema'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return (await readyDb()).select().from(s.users).orderBy(asc(s.users.createdAt))
})
