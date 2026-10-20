import { loadSchedule } from '../../services/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return loadSchedule(await readyDb())
})
