import { z } from 'zod'
import { loadMenu } from '../../services/catalog'
import { loadAdminMenus } from '../../services/admin'

export default defineMcpTool({
  name: 'get_menu',
  description: 'Carte détaillée (pizzas par section avec id, slug, base, prix en centimes, ingrédients avant/après cuisson, allergènes). Sans menuId : la carte active. Avec listOnly : la liste de toutes les cartes (actives, en préparation, archivées).',
  inputSchema: {
    menuId: z.string().optional().describe('Id ou slug de la carte'),
    listOnly: z.boolean().optional(),
  },
  annotations: { readOnlyHint: true },
  handler: async input => mcpCall('get_menu', input, 'read', async ({ db }) => {
    const menus = await loadAdminMenus(db)
    if (input.listOnly) return menus.map(m => ({ id: m.id, slug: m.slug, name: m.name, status: m.status, activatesOn: m.activatesOn, pizzaCount: m.items.length }))
    const id = input.menuId ? menus.find(m => m.id === input.menuId || m.slug === input.menuId)?.id : undefined
    if (input.menuId && !id) throw new Error(`Carte introuvable : ${input.menuId}`)
    const menu = await loadMenu(db, id)
    if (!menu) return 'Aucune carte active.'
    return {
      ...menu,
      sections: menu.sections.map(sec => ({
        section: sec.section,
        pizzas: sec.pizzas.map(p => ({
          id: p.id,
          slug: p.slug,
          name: p.name,
          baseKind: p.baseKind,
          baseLabel: p.baseLabel,
          priceCents: p.priceCents,
          avant: p.avant.map(i => i.name),
          apres: p.apres.map(i => i.name),
          allergens: p.allergens,
          tags: p.tags,
          translated: Boolean(p.i18n?.en?.name || p.i18n?.en?.baseLabel),
        })),
      })),
    }
  }),
})
