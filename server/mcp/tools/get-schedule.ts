import { z } from 'zod'
import { loadSchedule } from '../../services/admin'
import { loadScheduleData } from '../../services/catalog'
import { isoDateInParis } from '../../../shared/domain/dates'
import { resolveRange } from '../../../shared/domain/schedule'

export default defineMcpTool({
  name: 'get_schedule',
  description: 'Horaires et lieux : lieux (id, slug, adresse, coordonnées), saisons avec semaine type (weekday 1 = lundi … 7 = dimanche), exceptions (fermetures, vacances, lieux ponctuels), et le calendrier résolu sur N jours.',
  inputSchema: {
    days: z.number().int().min(1).max(120).default(21).describe('Nombre de jours du calendrier résolu'),
    from: z.string().optional().describe('Date de départ AAAA-MM-JJ (défaut : aujourd\'hui, heure de Paris)'),
  },
  annotations: { readOnlyHint: true },
  handler: async input => mcpCall('get_schedule', input, 'read', async ({ db }) => {
    const [raw, data] = await Promise.all([loadSchedule(db), loadScheduleData(db)])
    const calendar = resolveRange(data, input.from ?? isoDateInParis(), input.days)
    return {
      ...raw,
      calendar: calendar.map(d => ({ date: d.date, weekday: d.weekday, open: d.open, location: d.location?.slug ?? null, city: d.location?.city ?? null, opensAt: d.opensAt, closesAt: d.closesAt, exception: d.exception?.id ?? null })),
    }
  }),
})
