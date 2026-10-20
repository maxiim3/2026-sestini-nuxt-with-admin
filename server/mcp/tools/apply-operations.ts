import { z } from 'zod'
import { operationSchema } from '../../../shared/schemas'

export default defineMcpTool({
  name: 'apply_operations',
  description: `Outil d'écriture générique : applique une liste d'opérations en une transaction (tout ou rien), avec historique.
Opérations :
- { op: "create", entity, data, ref?: "$alias" } — entity ∈ location, season, scheduleException, ingredient, pizza, menu, featured, supplement, drink, dessert, modalMessage. "ref" permet de réutiliser l'id créé plus loin (ex. pizzaId: "$pdm").
- { op: "update", entity, id, data } — id ou slug ; data partielle.
- { op: "archive" | "restore", entity, id } — on archive plutôt que de supprimer.
- { op: "delete", entity: "scheduleException" | "modalMessage" | "featured", id }
- { op: "setPizzaIngredients", pizzaId, avant: [...], apres: [...] } — noms, slugs ou ids ; un nom inconnu crée l'ingrédient.
- { op: "setScheduleSlots", seasonId, slots: [{ weekday 1-7, locationId, opensAt "18:00", closesAt? }] } — remplace la semaine type.
- { op: "setMenuItems", menuId, items: [{ pizzaId, section: rouges|blanches|speciales, position }] } — remplace la composition.
- { op: "activateMenu", menuId } — met la carte en ligne et archive l'ancienne.
- { op: "setSetting", key, value }
- { op: "restoreRevision", revisionId }
Prix en centimes (priceCents). Dates AAAA-MM-JJ ; dates-heures de messages en ISO 8601 UTC. Traductions : i18n = { en: { name: "…" }, es: {…}, it: {…} }.`,
  inputSchema: {
    title: z.string().min(3).describe('Résumé lisible de la modification, ex. « Vacances de Noël »'),
    operations: z.array(operationSchema).min(1).max(100),
    publish: z.boolean().default(false).describe(publishFlag.describe),
  },
  handler: async input => mcpCall('apply_operations', input, 'write', ctx => mcpWrite(ctx, input.title, input.operations, input.publish)),
})
