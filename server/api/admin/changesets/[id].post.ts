import { z } from 'zod'
import { discardChangeset, publishChangeset } from '../../../services/operations'

const body = z.object({ action: z.enum(['publish', 'discard']) })

export default defineEventHandler(async (event) => {
  const { actor } = await requireAdmin(event)
  const id = getRouterParam(event, 'id')!
  const { action } = await readValidatedBody(event, body.parse)
  const db = await readyDb()
  try {
    return action === 'publish' ? await publishChangeset(db, id, actor) : await discardChangeset(db, id, actor)
  }
  catch (error) {
    asHttpError(error)
  }
})
