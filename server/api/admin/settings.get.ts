import { loadSettings } from '../../services/catalog'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  return loadSettings(await readyDb())
})
