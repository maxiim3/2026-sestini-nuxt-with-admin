import { z } from 'zod'
import { slugify } from '../../../shared/domain/text'
import { translationsSchema, type Operation } from '../../../shared/schemas'

export default defineMcpTool({
  name: 'add_schedule_exception',
  description: 'Ajoute une exception au planning : fermeture (un jour ou des vacances), lieu ponctuel (événement), horaires spéciaux, ou ouverture supplémentaire. Pour un lieu ponctuel inconnu, décrivez-le dans newLocation (il sera créé).',
  inputSchema: {
    kind: z.enum(['closed', 'relocated', 'hours', 'extra']).describe('closed = fermé ; relocated = autre lieu ; hours = horaires spéciaux ; extra = ouverture exceptionnelle un jour normalement fermé'),
    startsOn: z.string().describe('AAAA-MM-JJ'),
    endsOn: z.string().describe('AAAA-MM-JJ (égal à startsOn pour un seul jour)'),
    locationId: z.string().optional().describe('Lieu existant (id ou slug, voir get_schedule)'),
    newLocation: z.object({
      name: z.string(),
      address: z.string(),
      city: z.string(),
      zip: z.string(),
      lat: z.number(),
      lng: z.number(),
    }).optional(),
    opensAt: z.string().optional().describe('HH:MM'),
    closesAt: z.string().optional().describe('HH:MM'),
    note: z.string().optional().describe('Texte public, ex. « Congés annuels, retour le 6 janvier »'),
    i18n: translationsSchema,
    publish: z.boolean().default(false).describe(publishFlag.describe),
  },
  handler: async input => mcpCall('add_schedule_exception', input, 'write', async (ctx) => {
    const ops: Operation[] = []
    let locationId = input.locationId ?? null
    if (input.newLocation) {
      ops.push({ op: 'create', entity: 'location', ref: '$lieu', data: { ...input.newLocation, slug: `${slugify(input.newLocation.city)}-${slugify(input.newLocation.name)}` } })
      locationId = '$lieu'
    }
    if ((input.kind === 'relocated' || input.kind === 'extra') && !locationId) throw new Error('Un lieu est requis pour ce type d\'exception')
    ops.push({
      op: 'create',
      entity: 'scheduleException',
      data: { kind: input.kind, startsOn: input.startsOn, endsOn: input.endsOn, locationId, opensAt: input.opensAt ?? null, closesAt: input.closesAt ?? null, note: input.note ?? null, i18n: input.i18n ?? null },
    })
    return mcpWrite(ctx, `Exception d'horaires (${input.kind}) du ${input.startsOn} au ${input.endsOn}`, ops, input.publish)
  }),
})
