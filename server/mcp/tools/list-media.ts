import { desc } from 'drizzle-orm'
import * as s from '../../database/schema'

export default defineMcpTool({
  name: 'list_media',
  description: 'Photos importées dans l\'atelier (url, texte alternatif, étiquettes). Utilisez leur url pour imageUrl d\'une pizza, d\'un message ou d\'un document à imprimer. L\'import de nouvelles photos se fait dans l\'atelier.',
  inputSchema: {},
  annotations: { readOnlyHint: true },
  handler: async () => mcpCall('list_media', {}, 'read', async ({ db }) => {
    const origin = getRequestURL(useEvent()).origin
    const rows = await db.select().from(s.media).orderBy(desc(s.media.createdAt)).limit(100)
    return rows.map(m => ({ ...m, url: m.url.startsWith('/') ? `${origin}${m.url}` : m.url }))
  }),
})
