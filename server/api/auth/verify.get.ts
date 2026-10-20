import { and, eq, isNull } from 'drizzle-orm'
import * as s from '../../database/schema'

export default defineEventHandler(async (event) => {
  const token = getQuery(event).token
  if (typeof token !== 'string' || token.length < 20) return sendRedirect(event, '/atelier/connexion?erreur=lien')

  const db = await readyDb()
  const tokenHash = await sha256(token)
  const [link] = await db.select().from(s.magicLinks).where(and(eq(s.magicLinks.tokenHash, tokenHash), isNull(s.magicLinks.usedAt)))
  if (!link || link.expiresAt < new Date().toISOString()) return sendRedirect(event, '/atelier/connexion?erreur=expire')

  const [user] = await db.select().from(s.users).where(eq(s.users.email, link.email))
  if (!user) return sendRedirect(event, '/atelier/connexion?erreur=lien')

  const now = new Date().toISOString()
  await db.update(s.magicLinks).set({ usedAt: now }).where(eq(s.magicLinks.id, link.id))
  await db.update(s.users).set({ lastLoginAt: now }).where(eq(s.users.id, user.id))

  await setUserSession(event, {
    user: { id: user.id, email: user.email, name: user.name, role: user.role },
    loggedInAt: now,
  })
  return sendRedirect(event, link.redirect ?? '/atelier')
})
