import { z } from 'zod'
import { slugify } from '../../../shared/domain/text'
import { listEntity } from '../../services/admin'
import { loadPizzas } from '../../services/catalog'

export default defineMcpTool({
  name: 'search_catalog',
  description: 'Recherche dans le catalogue, archives comprises : pizzas (y compris anciennes cartes et anciennes pizzas du moment, utiles comme modèles), ingrédients (type, allergènes, traductions), boissons, suppléments, desserts.',
  inputSchema: {
    kind: z.enum(['pizza', 'ingredient', 'drink', 'supplement', 'dessert']),
    query: z.string().optional().describe('Texte à chercher dans le nom'),
    includeArchived: z.boolean().default(true),
  },
  annotations: { readOnlyHint: true },
  handler: async input => mcpCall('search_catalog', input, 'read', async ({ db }) => {
    const q = input.query ? slugify(input.query) : ''
    const match = (name: string) => !q || slugify(name).includes(q)
    if (input.kind === 'pizza') {
      return (await loadPizzas(db))
        .filter(p => match(p.name) && (input.includeArchived || !p.archived))
        .map(p => ({ id: p.id, slug: p.slug, name: p.name, archived: p.archived, baseKind: p.baseKind, baseLabel: p.baseLabel, priceCents: p.priceCents, avant: p.avant.map(i => i.name), apres: p.apres.map(i => i.name), allergens: p.allergens }))
    }
    const rows = await listEntity(db, input.kind) as Array<Record<string, unknown> & { archivedAt?: string | null }>
    return rows.filter(r => match(String(r.name ?? r.label ?? '')) && (input.includeArchived || !r.archivedAt))
  }),
})
