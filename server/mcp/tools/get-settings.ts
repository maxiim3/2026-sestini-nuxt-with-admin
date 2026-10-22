import { loadSettings } from '../../services/catalog'

export default defineMcpTool({
  name: 'get_settings',
  description: 'Réglages du site : contact (site.contact, dont company : la société affichée en bas du site), fonctionnalités (site.features : desserts, reviews, featuredOnHome), accroche (site.pitch).',
  inputSchema: {},
  annotations: { readOnlyHint: true },
  handler: async () => mcpCall('get_settings', {}, 'read', async ({ db }) => loadSettings(db)),
})
