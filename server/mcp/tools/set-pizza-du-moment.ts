import { and, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { ALLERGENS, BASE_KINDS } from '../../../shared/domain/constants'
import { slugify } from '../../../shared/domain/text'
import { translationsSchema, type Operation } from '../../../shared/schemas'
import * as s from '../../database/schema'

export default defineMcpTool({
  name: 'set_pizza_du_moment',
  description: 'Définit la pizza du moment : soit une pizza existante (pizzaId : id ou slug, y compris une ancienne pizza archivée), soit une nouvelle pizza décrite dans "newPizza". Archive par défaut les pizzas du moment en cours. Gère l\'affichage accueil / carte / modale et les dates.',
  inputSchema: {
    pizzaId: z.string().optional().describe('Pizza existante (id ou slug)'),
    newPizza: z.object({
      name: z.string(),
      baseKind: z.enum(BASE_KINDS),
      baseLabel: z.string().describe('ex. « Crème de ricotta »'),
      priceEuros: z.number().positive(),
      avant: z.array(z.string()).describe('Ingrédients avant cuisson'),
      apres: z.array(z.string()).default([]).describe('Ingrédients après cuisson'),
      extraAllergens: z.array(z.enum(ALLERGENS)).default([]),
      i18n: translationsSchema,
    }).optional(),
    title: z.string().default('La Pizza du Moment'),
    pitch: z.string().optional().describe('Phrase d\'accroche (bandeau, accueil)'),
    startsOn: z.string().optional().describe('AAAA-MM-JJ, défaut : maintenant'),
    endsOn: z.string().optional().describe('AAAA-MM-JJ, défaut : sans fin'),
    showOnHome: z.boolean().default(true),
    showOnMenu: z.boolean().default(true),
    showInModal: z.boolean().default(false).describe('Si true et qu\'aucun message plus prioritaire n\'est actif, le bandeau du site présente la pizza'),
    archiveCurrent: z.boolean().default(true),
    i18n: translationsSchema.describe('Traductions de title et pitch'),
    publish: z.boolean().default(false).describe(publishFlag.describe),
  },
  handler: async input => mcpCall('set_pizza_du_moment', input, 'write', async (ctx) => {
    if (!input.pizzaId && !input.newPizza) throw new Error('Indiquez pizzaId ou newPizza')
    const ops: Operation[] = []
    if (input.archiveCurrent) {
      const current = await ctx.db.select().from(s.featuredPizzas).where(and(isNull(s.featuredPizzas.archivedAt)))
      for (const f of current) ops.push({ op: 'archive', entity: 'featured', id: f.id })
    }
    let pizzaRef = input.pizzaId
    if (input.newPizza) {
      const p = input.newPizza
      ops.push(
        { op: 'create', entity: 'pizza', ref: '$pdm', data: { slug: `pdm-${slugify(p.name)}-${Date.now().toString(36)}`, name: p.name, baseKind: p.baseKind, baseLabel: p.baseLabel, priceCents: Math.round(p.priceEuros * 100), extraAllergens: p.extraAllergens, i18n: p.i18n ?? null } },
        { op: 'setPizzaIngredients', pizzaId: '$pdm', avant: p.avant, apres: p.apres },
      )
      pizzaRef = '$pdm'
    }
    else {
      ops.push({ op: 'restore', entity: 'pizza', id: pizzaRef! })
    }
    ops.push({
      op: 'create',
      entity: 'featured',
      data: { pizzaId: pizzaRef, title: input.title, pitch: input.pitch ?? null, startsOn: input.startsOn ?? null, endsOn: input.endsOn ?? null, showOnHome: input.showOnHome, showOnMenu: input.showOnMenu, showInModal: input.showInModal, i18n: input.i18n ?? null },
    })
    return mcpWrite(ctx, `Pizza du moment : ${input.newPizza?.name ?? input.pizzaId}`, ops, input.publish)
  }),
})
