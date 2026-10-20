import { z } from 'zod'
import { loadRevisions } from '../../services/admin'
import { desc, eq } from 'drizzle-orm'
import * as s from '../../database/schema'

export default defineMcpTool({
  name: 'get_history',
  description: 'Historique des modifications (révisions avec état avant/après, auteur) et brouillons. Une révision peut être restaurée avec apply_operations { op: "restoreRevision", revisionId }.',
  inputSchema: {
    entity: z.string().optional().describe('pizza, ingredient, menu, menuItems, featured, drink, supplement, location, season, scheduleSlots, scheduleException, modalMessage, setting…'),
    entityId: z.string().optional(),
    limit: z.number().int().min(1).max(200).default(30),
    drafts: z.enum(['draft', 'published', 'discarded']).optional().describe('Lister les brouillons de ce statut plutôt que les révisions'),
  },
  annotations: { readOnlyHint: true },
  handler: async input => mcpCall('get_history', input, 'read', async ({ db }) => {
    if (input.drafts) return db.select().from(s.changesets).where(eq(s.changesets.status, input.drafts)).orderBy(desc(s.changesets.createdAt)).limit(input.limit)
    return loadRevisions(db, input)
  }),
})
