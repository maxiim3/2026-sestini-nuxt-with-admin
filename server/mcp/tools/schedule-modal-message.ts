import { z } from 'zod'
import { MODAL_KINDS } from '../../../shared/domain/constants'
import { modalCtaInput, translationsSchema } from '../../../shared/schemas'

export default defineMcpTool({
  name: 'schedule_modal_message',
  description: 'Programme un message dans le bandeau du site (fermeture, vacances, nouvelle carte, événement, info). Le message s\'affiche automatiquement entre startsAt et endsAt ; le plus prioritaire gagne (message permanent de la carte : priorité 10 ; une annonce ponctuelle : 50 à 100). Pensez à fournir les traductions en, es, it.',
  inputSchema: {
    kind: z.enum(MODAL_KINDS),
    title: z.string(),
    body: z.string().describe('Markdown léger : paragraphes séparés par une ligne vide, **gras**'),
    ctas: z.array(modalCtaInput).default([]).describe('ex. [{ label: "Voir la carte", href: "/la-carte", variant: "primary" }, { label: "Appeler", href: "tel:" }]'),
    startsAt: z.string().optional().describe('ISO 8601, ex. 2026-12-20T00:00:00+01:00'),
    endsAt: z.string().optional().describe('ISO 8601'),
    priority: z.number().int().default(50),
    imageUrl: z.string().optional(),
    i18n: translationsSchema.describe('{ en: { title, body }, es: {…}, it: {…} }'),
    publish: z.boolean().default(false).describe(publishFlag.describe),
  },
  handler: async input => mcpCall('schedule_modal_message', input, 'write', async (ctx) => {
    const iso = (v?: string) => (v ? new Date(v).toISOString() : null)
    return mcpWrite(ctx, `Message du bandeau : ${input.title}`, [{
      op: 'create',
      entity: 'modalMessage',
      data: { kind: input.kind, title: input.title, body: input.body, ctas: input.ctas, startsAt: iso(input.startsAt), endsAt: iso(input.endsAt), priority: input.priority, imageUrl: input.imageUrl ?? null, enabled: true, i18n: input.i18n ?? null },
    }], input.publish)
  }),
})
