import type * as s from '~~/server/database/schema'

/** Types des lignes brutes renvoyées par /api/admin/entities/:entity */
export interface AdminRows {
  location: typeof s.locations.$inferSelect
  season: typeof s.seasons.$inferSelect
  scheduleException: typeof s.scheduleExceptions.$inferSelect
  ingredient: typeof s.ingredients.$inferSelect
  featured: typeof s.featuredPizzas.$inferSelect
  supplement: typeof s.supplements.$inferSelect
  drink: typeof s.drinks.$inferSelect
  dessert: typeof s.desserts.$inferSelect
  modalMessage: typeof s.modalMessages.$inferSelect
}

/** Lecture typée d'une entité de l'atelier (archives comprises) */
export function useAdminEntity<E extends keyof AdminRows>(entity: E) {
  return useFetch<AdminRows[E][]>(`/api/admin/entities/${entity}`, { key: `admin-${entity}` })
}
