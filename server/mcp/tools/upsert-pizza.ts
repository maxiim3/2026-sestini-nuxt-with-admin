import { eq, or } from 'drizzle-orm'
import { z } from 'zod'
import { ALLERGENS, BASE_KINDS, MENU_SECTIONS } from '../../../shared/domain/constants'
import { slugify } from '../../../shared/domain/text'
import { translationsSchema, type Operation } from '../../../shared/schemas'
import * as s from '../../database/schema'
import { loadAdminMenus } from '../../services/admin'

export default defineMcpTool({
  name: 'upsert_pizza',
  description: 'Crée ou modifie une pizza (recherche par slug ou id ; sinon création) avec ses ingrédients, et peut l\'ajouter à une carte (par défaut la carte active) dans une section.',
  inputSchema: {
    idOrSlug: z.string().optional().describe('Pizza existante à modifier'),
    name: z.string(),
    baseKind: z.enum(BASE_KINDS),
    baseLabel: z.string(),
    priceEuros: z.number().positive(),
    avant: z.array(z.string()),
    apres: z.array(z.string()).default([]),
    extraAllergens: z.array(z.enum(ALLERGENS)).default([]),
    i18n: translationsSchema,
    addToMenu: z.object({
      menuId: z.string().optional().describe('Id ou slug ; défaut : carte active'),
      section: z.enum(MENU_SECTIONS),
    }).optional(),
    publish: z.boolean().default(false).describe(publishFlag.describe),
  },
  handler: async input => mcpCall('upsert_pizza', input, 'write', async (ctx) => {
    const slug = input.idOrSlug ? input.idOrSlug : slugify(input.name)
    const [existing] = await ctx.db.select().from(s.pizzas).where(or(eq(s.pizzas.id, slug), eq(s.pizzas.slug, slug)))
    const data = { name: input.name, baseKind: input.baseKind, baseLabel: input.baseLabel, priceCents: Math.round(input.priceEuros * 100), extraAllergens: input.extraAllergens, ...(input.i18n ? { i18n: input.i18n } : {}) }
    const ref = existing?.id ?? '$pizza'
    const ops: Operation[] = existing
      ? [{ op: 'update', entity: 'pizza', id: existing.id, data }]
      : [{ op: 'create', entity: 'pizza', ref: '$pizza', data: { ...data, slug: slugify(input.name) } }]
    ops.push({ op: 'setPizzaIngredients', pizzaId: ref, avant: input.avant, apres: input.apres })

    if (input.addToMenu) {
      const menus = await loadAdminMenus(ctx.db)
      const menu = input.addToMenu.menuId ? menus.find(m => m.id === input.addToMenu!.menuId || m.slug === input.addToMenu!.menuId) : menus.find(m => m.status === 'active')
      if (!menu) throw new Error('Carte introuvable')
      const items = menu.items.filter(i => i.pizzaId !== existing?.id).map(i => ({ pizzaId: i.pizzaId, section: i.section, position: i.position }))
      items.push({ pizzaId: ref, section: input.addToMenu.section, position: items.filter(i => i.section === input.addToMenu!.section).length })
      ops.push({ op: 'setMenuItems', menuId: menu.id, items })
    }
    return mcpWrite(ctx, `${existing ? 'Modification' : 'Création'} de la pizza ${input.name}`, ops, input.publish)
  }),
})
