import { count, eq } from 'drizzle-orm'
import * as s from '../../database/schema'
import { loadPublicSnapshot } from '../../services/catalog'

export default defineMcpTool({
  name: 'site_overview',
  description: 'Vue d\'ensemble de ce qui est en ligne : ce soir (lieu, statut), les 14 prochains jours, la carte active, la pizza du moment, le message de la modale, les brouillons en attente. À appeler en premier.',
  inputSchema: {},
  annotations: { readOnlyHint: true },
  handler: async () => mcpCall('site_overview', {}, 'read', async ({ db }) => {
    const snap = await loadPublicSnapshot(db)
    const [drafts] = await db.select({ n: count() }).from(s.changesets).where(eq(s.changesets.status, 'draft'))
    const origin = getRequestURL(useEvent()).origin
    return {
      demoDatabase: isDemoDatabase(),
      tonight: snap.tonight,
      next14Days: snap.week.map(d => ({ date: d.date, open: d.open, city: d.location?.city ?? null, place: d.location?.name ?? null, opensAt: d.opensAt, exception: d.exception ? { kind: d.exception.kind, note: d.exception.note } : null })),
      activeMenu: snap.menu ? { id: snap.menu.id, name: snap.menu.name, sections: snap.menu.sections.map(sec => ({ section: sec.section, pizzas: sec.pizzas.map(p => `${p.name} (${p.priceCents / 100} €)`) })) } : null,
      featured: snap.featured.map(f => ({ id: f.id, title: f.title, pizza: f.pizza.name, startsOn: f.startsOn, endsOn: f.endsOn, showInModal: f.showInModal })),
      modal: snap.modal ? { id: snap.modal.id, kind: snap.modal.kind, title: snap.modal.title } : null,
      pendingDrafts: drafts?.n ?? 0,
      urls: { site: origin, menu: `${origin}/la-carte`, findUs: `${origin}/nous-trouver`, drafts: `${origin}/atelier/brouillons` },
    }
  }),
})
