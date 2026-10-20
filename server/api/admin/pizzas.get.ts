import { loadAdminPizzas } from '../../services/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return loadAdminPizzas(await readyDb())
})
