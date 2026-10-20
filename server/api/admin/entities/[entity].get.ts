import { isEntity, listEntity } from '../../../services/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const entity = getRouterParam(event, 'entity') ?? ''
  if (!isEntity(entity)) throw createError({ statusCode: 404, statusMessage: 'Entité inconnue' })
  return listEntity(await readyDb(), entity)
})
