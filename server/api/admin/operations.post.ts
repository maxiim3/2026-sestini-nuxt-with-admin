import { z } from 'zod'
import { commitOperations, proposeChangeset } from '../../services/operations'

const body = z.object({
  title: z.string().min(1).max(200),
  operations: z.array(z.unknown()).min(1).max(200),
  mode: z.enum(['publish', 'draft']).default('publish'),
})

/** Point d'entrée unique des écritures de l'admin : publie directement ou crée un brouillon */
export default defineEventHandler(async (event) => {
  const { actor } = await requireAdmin(event)
  const { title, operations, mode } = await readValidatedBody(event, body.parse)
  const db = await readyDb()
  try {
    if (mode === 'draft') {
      const changeset = await proposeChangeset(db, title, operations, actor)
      return { mode, changesetId: changeset.id }
    }
    return { mode, ...(await commitOperations(db, title, operations, actor)) }
  }
  catch (error) {
    asHttpError(error)
  }
})
