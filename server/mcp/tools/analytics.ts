import { z } from 'zod'
import { analyticsSummary } from '../../services/analytics'

export default defineMcpTool({
  name: 'get_analytics',
  description: 'Audience du site sur N jours (PostHog) : visiteurs, pages vues, clics « Appeler », vues de la carte, pages les plus vues, détail par jour. Si source = "demo", les chiffres sont fictifs (PostHog pas encore branché) : ne pas en tirer de conclusions.',
  inputSchema: { days: z.number().int().min(1).max(90).default(7) },
  annotations: { readOnlyHint: true },
  handler: async input => mcpCall('get_analytics', input, 'read', async () => analyticsSummary(input.days)),
})
