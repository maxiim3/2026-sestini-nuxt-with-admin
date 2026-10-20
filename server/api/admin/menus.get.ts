import { loadAdminMenus } from '../../services/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return loadAdminMenus(await readyDb())
})
