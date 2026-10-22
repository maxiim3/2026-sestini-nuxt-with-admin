import { exportBackup } from '../../services/backup'

export default defineMcpTool({
  name: 'export_backup',
  description: 'Sauvegarde complète du contenu du site, au format JSON de l\'atelier (page Sauvegarde) : réglages, lieux, saisons et créneaux, exceptions, ingrédients, pizzas (ingrédients avant/après cuisson par slug), cartes, pizzas du moment, suppléments, boissons, desserts, messages du bandeau, archives comprises. Prix en centimes. Lecture seule ; ni comptes, ni jetons, ni journal.',
  inputSchema: {},
  annotations: { readOnlyHint: true },
  handler: async () => mcpCall('export_backup', {}, 'read', async ({ db }) => exportBackup(db)),
})
