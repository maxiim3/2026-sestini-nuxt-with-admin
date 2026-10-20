import { count, desc, eq } from 'drizzle-orm'
import * as s from '../../database/schema'
import { loadPublicSnapshot } from '../../services/catalog'
import { analyticsSummary } from '../../services/analytics'

export default defineEventHandler(async (event) => {
  const { user } = await requireAdmin(event)
  const db = await readyDb()
  const [snapshot, drafts, revisions, analytics] = await Promise.all([
    loadPublicSnapshot(db),
    db.select({ n: count() }).from(s.changesets).where(eq(s.changesets.status, 'draft')),
    db.select().from(s.revisions).orderBy(desc(s.revisions.createdAt)).limit(8),
    analyticsSummary(7),
  ])
  return {
    user,
    demoDatabase: isDemoDatabase(),
    tonight: snapshot.tonight,
    week: snapshot.week.slice(0, 7),
    menu: snapshot.menu ? { name: snapshot.menu.name, count: snapshot.menu.sections.reduce((n, sec) => n + sec.pizzas.length, 0) } : null,
    featured: snapshot.featured.map(f => ({ id: f.id, title: f.title, pizza: f.pizza.name })),
    modal: snapshot.modal ? { title: snapshot.modal.title, kind: snapshot.modal.kind } : null,
    draftCount: drafts[0]?.n ?? 0,
    recentRevisions: revisions,
    analytics,
  }
})
