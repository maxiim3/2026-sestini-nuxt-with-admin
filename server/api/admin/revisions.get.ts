import { loadRevisions } from '../../services/admin'

export default defineEventHandler(async (event) => {
  await requireAdmin(event)
  const q = getQuery(event)
  return loadRevisions(await readyDb(), {
    entity: typeof q.entity === 'string' ? q.entity : undefined,
    entityId: typeof q.entityId === 'string' ? q.entityId : undefined,
    limit: Math.min(Number(q.limit) || 100, 500),
  })
})
