import { z } from 'zod'
import { discardChangeset, publishChangeset } from '../../services/operations'

export default defineMcpTool({
  name: 'decide_draft',
  description: 'Publie ou rejette un brouillon (changeset). Publier exige un jeton avec la portée « publish » ; sinon un humain valide dans l\'atelier.',
  inputSchema: {
    changesetId: z.string(),
    action: z.enum(['publish', 'discard']),
  },
  handler: async input => mcpCall('decide_draft', input, input.action === 'publish' ? 'publish' : 'write', async (ctx) => {
    const actor = mcpActor(ctx.auth)
    return input.action === 'publish' ? publishChangeset(ctx.db, input.changesetId, actor) : discardChangeset(ctx.db, input.changesetId, actor)
  }),
})
