import { desc } from 'drizzle-orm'
import * as s from '../../database/schema'

export default defineMcpTool({
  name: 'list_modal_messages',
  description: 'Messages de la modale d\'accueil (programmés, actifs, expirés, archivés). Le message affiché est le plus prioritaire parmi ceux actifs dans leur fenêtre de dates.',
  inputSchema: {},
  annotations: { readOnlyHint: true },
  handler: async () => mcpCall('list_modal_messages', {}, 'read', async ({ db }) => {
    const now = new Date().toISOString()
    const rows = await db.select().from(s.modalMessages).orderBy(desc(s.modalMessages.updatedAt))
    return rows.map(m => ({
      ...m,
      state: m.archivedAt ? 'archivé' : !m.enabled ? 'désactivé' : m.endsAt && m.endsAt <= now ? 'expiré' : m.startsAt && m.startsAt > now ? 'programmé' : 'actif',
    }))
  }),
})
